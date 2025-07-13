ALTER TABLE "jas_user" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "jas_user" ALTER COLUMN "phone" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "jas_speaking_test" ADD COLUMN "call_id" varchar(255);