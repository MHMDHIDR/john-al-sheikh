CREATE TYPE "public"."jas_speaking_test_type" AS ENUM('MOCK', 'PRACTICE', 'OFFICIAL');--> statement-breakpoint
CREATE TABLE "jas_speaking_test" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"type" "jas_speaking_test_type" DEFAULT 'MOCK' NOT NULL,
	"transcription" jsonb,
	"topic" varchar(255) NOT NULL,
	"band" numeric(3, 1),
	"feedback" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jas_speaking_test" ADD CONSTRAINT "jas_speaking_test_user_id_jas_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."jas_user"("id") ON DELETE no action ON UPDATE no action;