import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { env } from "@/env";
import { creditPackages, stripe } from "@/lib/stripe";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { creditTransactions, users } from "@/server/db/schema";

export const paymentsRouter = createTRPCRouter({
  /**
   * Create a Stripe checkout session for the user to purchase credits
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        packageId: z.enum(["fiveCredits", "fifteenCredits", "twentyCredits"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { packageId } = input;
      const { session } = ctx;
      const userId = session.user.id;

      // Get user's email from session and ensure it's a string
      const userEmail = session.user.email ?? "";

      const packageInfo = creditPackages[packageId];

      // Create Stripe Checkout session
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: userEmail, // Prefill the email field
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
        },
      });

      if (!checkoutSession.url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }

      return { checkoutUrl: checkoutSession.url };
    }),

  /**
   * Verify a Stripe checkout session and add credits to the user's account
   */
  verifySession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { sessionId } = input;
      const { session } = ctx;
      const userId = session.user.id;

      console.log(`Starting verification for session ${sessionId} for user ${userId}`);

      // Retrieve the checkout session from Stripe
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      console.log(`Retrieved Stripe session, payment status: ${checkoutSession.payment_status}`);

      if (!checkoutSession || checkoutSession.payment_status !== "paid") {
        console.error(`Session ${sessionId} payment status is not paid`);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment not completed",
        });
      }

      // Validate that the metadata has expected values
      const metadataUserId = checkoutSession.metadata?.userId;
      console.log(`Metadata userId: ${metadataUserId}, authenticated userId: ${userId}`);

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
        console.log(`Session ${sessionId} already processed, transaction exists`);
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

      console.log(
        `Processing payment: adding ${creditsToAdd} credits, new balance will be ${newCreditBalance}`,
      );

      try {
        // Begin transaction to update user credits and create transaction record
        await db.transaction(async tx => {
          // Update user credits
          await tx.update(users).set({ credits: newCreditBalance }).where(eq(users.id, userId));
          console.log(`Updated credits for user ${userId}`);

          // Create transaction record
          await tx.insert(creditTransactions).values({
            userId,
            type: "PURCHASE",
            amount: creditsToAdd,
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
          console.log(`Created transaction record for session ${sessionId}`);
        });

        console.log(`Transaction completed successfully for session ${sessionId}`);
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

  /**
   * Use credits for a speaking test
   */
  useCreditsForTest: protectedProcedure
    .input(
      z.object({
        speakingTestId: z.string(),
        creditCost: z.number().default(1), // Default cost is 1 credit
      }),
    )
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

    return { credits: user.credits };
  }),

  /**
   * Get user's credit transaction history
   */
  getTransactionHistory: protectedProcedure.query(async ({ ctx }) => {
    const { session } = ctx;
    const userId = session.user.id;

    const transactions = await db.query.creditTransactions.findMany({
      where: eq(creditTransactions.userId, userId),
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
    });

    return transactions;
  }),
});
