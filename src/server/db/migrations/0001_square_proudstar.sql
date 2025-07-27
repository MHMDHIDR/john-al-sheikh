ALTER TABLE "jas_authenticator" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "jas_authenticator" CASCADE;--> statement-breakpoint
ALTER TABLE "jas_speaking_tests" ALTER COLUMN "vocabulary_score" SET DATA TYPE jsonb;