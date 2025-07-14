CREATE TYPE "public"."jas_newsletter_status" AS ENUM('PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TABLE "jas_newsletter_send_queue" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"recipient_name" varchar(255),
	"subject" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"cta_url" varchar(255),
	"cta_button_label" varchar(255),
	"status" "jas_newsletter_status" DEFAULT 'PENDING' NOT NULL,
	"error" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
