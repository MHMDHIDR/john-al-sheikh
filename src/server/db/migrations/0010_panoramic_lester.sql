ALTER TABLE "jas_credit_transaction" RENAME COLUMN "credit_cost" TO "minutes_cost";--> statement-breakpoint
ALTER TABLE "jas_credit_transaction" RENAME COLUMN "credits_after" TO "minutes_after";--> statement-breakpoint
ALTER TABLE "jas_user" RENAME COLUMN "credits" TO "minutes";