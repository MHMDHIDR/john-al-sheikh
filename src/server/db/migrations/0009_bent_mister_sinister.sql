CREATE TABLE "jas_newsletter" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"subject" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"cta_url" varchar(255),
	"cta_button_label" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jas_newsletter_send_queue" ADD COLUMN "newsletter_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "jas_newsletter_send_queue" ADD CONSTRAINT "jas_newsletter_send_queue_newsletter_id_jas_newsletter_id_fk" FOREIGN KEY ("newsletter_id") REFERENCES "public"."jas_newsletter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jas_newsletter_send_queue" DROP COLUMN "subject";--> statement-breakpoint
ALTER TABLE "jas_newsletter_send_queue" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "jas_newsletter_send_queue" DROP COLUMN "cta_url";--> statement-breakpoint
ALTER TABLE "jas_newsletter_send_queue" DROP COLUMN "cta_button_label";