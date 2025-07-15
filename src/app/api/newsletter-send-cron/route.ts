import { eq } from "drizzle-orm";
import { Resend } from "resend";
import NewsletterEmailTemplate from "@/emails/newsletter-email";
import { env } from "@/env";
import { generateUnsubscribeToken } from "@/lib/unsubscribe-token";
import { db } from "@/server/db";
import { newsletters, newsletterSendQueue, subscribedEmails, users } from "@/server/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const BATCH_SIZE = 2; // Resend rate limit
  const resend = new Resend(env.AUTH_RESEND_KEY);

  // Fetch the next batch of pending emails
  const queue = await db
    .select()
    .from(newsletterSendQueue)
    .where(eq(newsletterSendQueue.status, "PENDING"))
    .orderBy(newsletterSendQueue.createdAt)
    .limit(BATCH_SIZE);

  if (queue.length === 0) {
    return new Response("No pending emails.", { status: 200 });
  }

  for (const item of queue) {
    try {
      // Fetch the newsletter content for this queue item
      const newsletter = await db.query.newsletters.findFirst({
        where: eq(newsletters.id, item.newsletterId),
      });
      if (!newsletter) {
        throw new Error("Newsletter content not found for queue item");
      }

      // Find the recipient in either subscribedEmails or users
      const [subscribed, user] = await Promise.all([
        db.query.subscribedEmails.findFirst({
          where: eq(subscribedEmails.email, item.recipientEmail),
        }),
        db.query.users.findFirst({ where: eq(users.email, item.recipientEmail) }),
      ]);
      let unsubscribeToken = "";
      if (subscribed) {
        unsubscribeToken = generateUnsubscribeToken(subscribed);
      } else if (user?.isNewsletterSubscribed) {
        unsubscribeToken = generateUnsubscribeToken(user);
      }

      // Send the email
      await resend.emails.send({
        from: env.ADMIN_EMAIL,
        to: item.recipientEmail,
        subject: newsletter.subject,
        react: NewsletterEmailTemplate({
          senderName: "فريق المنصة",
          name: item.recipientName,
          subject: newsletter.subject,
          customContent: newsletter.content,
          ctaUrl: newsletter.ctaUrl ?? `${env.NEXT_PUBLIC_APP_URL}/signin`,
          ctaButtonLabel: newsletter.ctaButtonLabel ?? "زيارة المنصة",
          unsubscribeToken,
        }),
      });

      // Mark as sent
      await db
        .update(newsletterSendQueue)
        .set({
          status: "SENT",
          sentAt: new Date(),
          attemptCount: item.attemptCount + 1,
          lastAttemptAt: new Date(),
          error: null,
          updatedAt: new Date(),
        })
        .where(eq(newsletterSendQueue.id, item.id));
    } catch (error: unknown) {
      // Mark as failed, increment attempt count
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      await db
        .update(newsletterSendQueue)
        .set({
          status: "FAILED",
          error: errorMessage,
          attemptCount: item.attemptCount + 1,
          lastAttemptAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(newsletterSendQueue.id, item.id));
    }
  }

  return new Response(`Processed ${queue.length} emails.`, { status: 200 });
}
