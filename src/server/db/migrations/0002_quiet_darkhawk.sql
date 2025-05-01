ALTER TABLE "jas_subscribed_email" RENAME TO "jas_subscribed_emails";--> statement-breakpoint
ALTER TABLE "jas_subscribed_emails" DROP CONSTRAINT "jas_subscribed_email_email_unique";--> statement-breakpoint
ALTER TABLE "jas_subscribed_emails" ADD CONSTRAINT "jas_subscribed_emails_email_unique" UNIQUE("email");