ALTER TABLE "jas_speaking_test" RENAME TO "jas_speaking_tests";--> statement-breakpoint
ALTER TABLE "jas_speaking_tests" RENAME COLUMN "word_usage" TO "vocabulary_score";--> statement-breakpoint
ALTER TABLE "jas_credit_transaction" DROP CONSTRAINT "jas_credit_transaction_speaking_test_id_jas_speaking_test_id_fk";
--> statement-breakpoint
ALTER TABLE "jas_speaking_tests" DROP CONSTRAINT "jas_speaking_test_user_id_jas_user_id_fk";
--> statement-breakpoint
ALTER TABLE "jas_speaking_tests" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "jas_speaking_tests" ALTER COLUMN "transcription" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "jas_speaking_tests" ADD COLUMN "grammar_score" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "jas_speaking_tests" ADD COLUMN "expression_complexity" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "jas_speaking_tests" ADD COLUMN "word_usage_history" jsonb;--> statement-breakpoint
ALTER TABLE "jas_credit_transaction" ADD CONSTRAINT "jas_credit_transaction_speaking_test_id_jas_speaking_tests_id_fk" FOREIGN KEY ("speaking_test_id") REFERENCES "public"."jas_speaking_tests"("id") ON DELETE no action ON UPDATE no action;