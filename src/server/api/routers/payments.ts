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
import { creditPackages, stripe } from "@/lib/stripe";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { creditTransactions, users } from "@/server/db/schema";
import type Stripe from "stripe";

type UserCountry = { ip: string; country: string };

export const paymentsRouter = createTRPCRouter({
  /** Create a Stripe checkout session for the user to purchase credits */
  createCheckoutSession: protectedProcedure
    .input(z.object({ packageId: z.enum(["fiveCredits", "fifteenCredits", "twentyCredits"]) }))
    .mutation(async ({ ctx, input }) => {
      const { packageId } = input;
      const { session } = ctx;
      const userId = session.user.id;
      const userEmail = session.user.email ?? "";

      const packageInfo = creditPackages[packageId];

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
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/buy-credits?cancelled=true`,
        metadata: {
          userId,
          packageId,
          credits: packageInfo.credits.toString(),
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

      // Retrieve the checkout session from Stripe
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

      if (!checkoutSession || checkoutSession.payment_status !== "paid") {
        console.error(`Session ${sessionId} payment status is not paid`);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment not completed",
        });
      }

      // Validate that the metadata has expected values
      const metadataUserId = checkoutSession.metadata?.userId;

      if (!metadataUserId) {
        console.error("Session is missing userId in metadata");
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid session: missing user information",
        });
      }

      // Check if session was already processed by looking up the transaction
      const existingTransaction = await db.query.creditTransactions.findFirst({
        where: eq(creditTransactions.stripePaymentId, sessionId),
      });

      if (existingTransaction) {
        return { success: true, alreadyProcessed: true };
      }

      // Get user current credits
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        console.error(`User ${userId} not found`);
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const creditsToAdd = Number(checkoutSession.metadata?.credits ?? 0);
      const packageName = checkoutSession.metadata?.packageName ?? "Credit Package";
      const newCreditBalance = user.credits + creditsToAdd;

      try {
        // Begin transaction to update user credits and create transaction record
        await db.transaction(async tx => {
          // Update user credits
          await tx.update(users).set({ credits: newCreditBalance }).where(eq(users.id, userId));

          // Create transaction record
          await tx.insert(creditTransactions).values({
            userId,
            type: "PURCHASE",
            amount: creditsToAdd,
            creditCost: creditsToAdd,
            creditsAfter: newCreditBalance,
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

        return { success: true, creditsAdded: creditsToAdd };
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

  /** Use credits for a speaking test */
  useCreditsForTest: protectedProcedure
    .input(z.object({ speakingTestId: z.string(), creditCost: z.number().default(1) }))
    .mutation(async ({ ctx, input }) => {
      const { speakingTestId, creditCost } = input;
      const { session } = ctx;
      const userId = session.user.id;

      // Get user current credits
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if user has enough credits
      if (user.credits < creditCost) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient credits",
        });
      }

      const newCreditBalance = user.credits - creditCost;

      // Begin transaction to update user credits and create transaction record
      await db.transaction(async tx => {
        // Update user credits
        await tx.update(users).set({ credits: newCreditBalance }).where(eq(users.id, userId));

        // Create transaction record
        await tx.insert(creditTransactions).values({
          userId,
          type: "USAGE",
          amount: -creditCost,
          creditsAfter: newCreditBalance,
          speakingTestId,
          creditCost,
          status: "COMPLETED",
          metadata: {
            testType: "MOCK", // Default to MOCK, this can be updated based on actual test type
          },
        });
      });

      return { success: true, remainingCredits: newCreditBalance };
    }),

  /**
   * Get user's credit balance
   * @returns {number} The user's credit balance
   */
  getUserCredits: protectedProcedure.query(async ({ ctx }) => {
    const { session } = ctx;
    const userId = session.user.id;

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return user.credits;
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
        credits: true,
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
});
