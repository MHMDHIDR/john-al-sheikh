import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { stripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { creditTransactions, users } from "@/server/db/schema";
import type { NextRequest } from "next/server";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("Missing Stripe signature header");
    return NextResponse.json(
      { success: false, error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      // Extract metadata
      const userId = session.metadata?.userId;
      const creditsToAdd = Number(session.metadata?.credits ?? 0);
      const packageName = session.metadata?.packageName ?? "Credit Package";

      if (!userId || !creditsToAdd) {
        console.error("Missing required metadata in Stripe session", session.metadata);
        return NextResponse.json({ success: false, error: "Missing metadata" }, { status: 400 });
      }

      // Check if transaction has already been processed
      const existingTransaction = await db.query.creditTransactions.findFirst({
        where: eq(creditTransactions.stripePaymentId, session.id),
      });

      if (existingTransaction) {
        return NextResponse.json({ success: true, alreadyProcessed: true });
      }

      // Get user current credits
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        console.error(`User not found: ${userId}`);
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }

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
            creditsAfter: newCreditBalance,
            stripePaymentId: session.id,
            packageName,
            priceInCents: session.amount_total ?? 0,
            currency: session.currency?.toUpperCase() ?? "GBP",
            status: "COMPLETED",
            metadata: {
              sessionId: session.id,
              paymentIntent:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : session.payment_intent &&
                      typeof session.payment_intent === "object" &&
                      "id" in session.payment_intent
                    ? session.payment_intent.id
                    : null,
            },
          });
        });

        return NextResponse.json({ success: true });
      } catch (dbError) {
        console.error(`Database transaction error:`, dbError);
        return NextResponse.json(
          { success: false, error: "Database transaction failed" },
          { status: 500 },
        );
      }
    } catch (error) {
      console.error("Error processing Stripe webhook:", error);
      return NextResponse.json(
        { success: false, error: "Error processing webhook" },
        { status: 500 },
      );
    }
  }

  // Handle other event types as needed
  return NextResponse.json({ received: true });
}
