import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "@/env";
import {
  calculateTotalBalance,
  createUserMap,
  enhanceTransactions,
  extractUserEmails,
} from "@/lib/payments";
import { minutePackages, stripe } from "@/lib/stripe";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { creditTransactions, users } from "@/server/db/schema";
import type Stripe from "stripe";

type UserCountry = { ip: string; country: string };

export const paymentsRouter = createTRPCRouter({
  /** Create a Stripe checkout session for the user to purchase credits */
  createCheckoutSession: protectedProcedure
    .input(z.object({ packageId: z.enum(["fiveMinutes", "tenMinutes", "fifteenMinutes"]) }))
    .mutation(async ({ ctx, input }) => {
      const { packageId } = input;
      const { session } = ctx;
      const userId = session.user.id;
      const userEmail = session.user.email ?? "";

      const packageInfo = minutePackages[packageId];

      const cookieStore = await cookies();
      const datafastVisitorId = cookieStore.get("datafast_visitor_id")?.value;
      const datafastSessionId = cookieStore.get("datafast_session_id")?.value;

      // Create Stripe Checkout session
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: userEmail,
        line_items: [
          {
            price: packageInfo.priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/buy-minutes?cancelled=true`,
        metadata: {
          userId,
          packageId,
          minutes: packageInfo.minutes.toString(),
          packageName: packageInfo.name,
          datafast_visitor_id: datafastVisitorId,
          datafast_session_id: datafastSessionId,
        },
      } as Stripe.Checkout.SessionCreateParams);

      if (!checkoutSession.url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }

      return { checkoutUrl: checkoutSession.url, sessionId: checkoutSession.id };
    }),

  /** Get the user's country from ipapi.co based on */
  getUserCountry: protectedProcedure.query(async () => {
    try {
      const countryCode = await fetch("https://api.country.is");
      if (countryCode.ok) {
        const countryResponse = (await countryCode.json()) as UserCountry;
        return countryResponse;
      }
    } catch (error) {
      console.error("Error detecting user country:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to detect user country",
      });
    }
  }),

  /** Verify a Stripe checkout session and add credits to the user's account */
  verifySession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { sessionId } = input;
      const { session } = ctx;
      const userId = session.user.id;

      // Check if transaction has already been processed
      const existingTransaction = await ctx.db.query.creditTransactions.findFirst({
        where: eq(creditTransactions.stripePaymentId, sessionId),
      });
      if (existingTransaction) {
        return { success: true, alreadyProcessed: true };
      }

      // Retrieve the Stripe session
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      if (!checkoutSession || checkoutSession.payment_status !== "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Checkout session not found or not paid",
        });
      }

      // Get user current minutes
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        console.error(`User ${userId} not found`);
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const minutesToAdd = Number(checkoutSession.metadata?.minutes ?? 0);
      const packageName = checkoutSession.metadata?.packageName ?? "Minutes Package";
      const newMinuteBalance = user.minutes + minutesToAdd;

      try {
        // Begin transaction to update user minutes and create transaction record
        await ctx.db.transaction(async tx => {
          // Update user minutes
          await tx.update(users).set({ minutes: newMinuteBalance }).where(eq(users.id, userId));

          // Create transaction record
          await tx.insert(creditTransactions).values({
            userId,
            type: "PURCHASE",
            amount: minutesToAdd,
            minutesCost: minutesToAdd,
            minutesAfter: newMinuteBalance,
            stripePaymentId: sessionId,
            packageName,
            priceInCents: checkoutSession.amount_total ?? 0,
            currency: checkoutSession.currency?.toUpperCase() ?? "GBP",
            status: "COMPLETED",
            metadata: {
              sessionId,
              paymentIntent:
                typeof checkoutSession.payment_intent === "string"
                  ? checkoutSession.payment_intent
                  : checkoutSession.payment_intent &&
                      typeof checkoutSession.payment_intent === "object" &&
                      "id" in checkoutSession.payment_intent
                    ? checkoutSession.payment_intent.id
                    : null,
            },
          });
        });

        return { success: true, minutesAdded: minutesToAdd };
      } catch (error) {
        console.error(
          `Error in db transaction: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process payment",
        });
      }
    }),

  /**
   * Get user's minutes balance
   * @returns {number} The user's credit balance
   */
  getUserMinutes: protectedProcedure.query(async ({ ctx }) => {
    const { session } = ctx;
    const userId = session.user.id;

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return user.minutes;
  }),

  getTransactionHistory: protectedProcedure.query(async ({ ctx }) => {
    const { session } = ctx;
    const userId = session.user.id;

    const transactions = await db.query.creditTransactions.findMany({
      where: eq(creditTransactions.userId, userId),
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
    });

    return transactions;
  }),

  getAccountBalance: protectedProcedure.query(async () => {
    // Get Stripe balance
    const balance = await stripe.balance.retrieve({
      expand: ["pending", "available", "instant_available"],
    });

    // Calculate simplified total balance (available - pending)
    const totalBalance = calculateTotalBalance(balance);

    // Get balance transactions
    const balanceTransactions = await stripe.balanceTransactions.list({
      expand: ["data.source"],
    });

    // Extract user emails from transactions
    const userEmails = extractUserEmails(balanceTransactions.data);

    // Get user details from database
    const users = await db.query.users.findMany({
      where: (users, { inArray, and }) =>
        and(inArray(users.email, userEmails), eq(users.role, "USER")),
      columns: {
        id: true,
        name: true,
        gender: true,
        email: true,
        displayName: true,
        minutes: true,
        role: true,
      },
    });

    // Filter out users with null emails before creating the map
    const usersWithEmails = users.filter(
      (user): user is typeof user & { email: string } => user.email !== null,
    );

    // Create user lookup map
    const userMap = createUserMap(usersWithEmails);

    // Enhance transactions with user details
    const enhancedTransactions = enhanceTransactions(balanceTransactions.data, userMap);

    return {
      balance: {
        total: totalBalance,
        available: balance.available,
        pending: balance.pending,
        livemode: balance.livemode,
      },
      balanceTransactions: enhancedTransactions,
    };
  }),

  deductUserMinutes: protectedProcedure
    .input(z.object({ minutes: z.number().min(1), callId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { minutes, callId } = input;
      const userId = ctx.session.user.id;

      // Get user current minutes
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.minutes < minutes) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient minutes",
        });
      }

      const newMinuteBalance = user.minutes - minutes;

      // Begin transaction to update user minutes and create transaction record
      await ctx.db.transaction(async tx => {
        await tx.update(users).set({ minutes: newMinuteBalance }).where(eq(users.id, userId));
        await tx.insert(creditTransactions).values({
          userId,
          type: "USAGE",
          amount: -minutes,
          minutesCost: minutes,
          minutesAfter: newMinuteBalance,
          status: "COMPLETED",
          metadata: {
            callId,
          },
        });
      });

      return { success: true, remainingMinutes: newMinuteBalance };
    }),
});
