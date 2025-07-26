ALTER TABLE "jas_user" ALTER COLUMN "minutes" SET DEFAULT 5;--> statement-breakpoint
ALTER TABLE "jas_newsletter" ADD COLUMN "image" varchar(255) DEFAULT '/newsletter-header.png' NOT NULL;