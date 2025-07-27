ALTER TABLE "jas_speaking_test" ADD COLUMN "unique_words_count" integer;--> statement-breakpoint
ALTER TABLE "jas_speaking_test" ADD COLUMN "new_words_count" integer;--> statement-breakpoint
ALTER TABLE "jas_speaking_test" ADD COLUMN "grammatical_error_count" integer;--> statement-breakpoint
ALTER TABLE "jas_speaking_test" ADD COLUMN "nativeness_score" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "jas_speaking_test" ADD COLUMN "word_usage" jsonb;