CREATE TYPE "public"."jas_content_type" AS ENUM('PRIVACY', 'TERMS');--> statement-breakpoint
CREATE TYPE "public"."jas_gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."jas_speaking_test_type" AS ENUM('MOCK', 'PRACTICE', 'OFFICIAL');--> statement-breakpoint
CREATE TYPE "public"."jas_theme" AS ENUM('light', 'dark');--> statement-breakpoint
CREATE TYPE "public"."jas_transaction_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."jas_transaction_type" AS ENUM('PURCHASE', 'USAGE');--> statement-breakpoint
CREATE TYPE "public"."jas_user_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'USER');--> statement-breakpoint
CREATE TYPE "public"."jas_user_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "jas_account" (
	"user_id" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "jas_account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "jas_credit_transaction" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"type" "jas_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"credits_after" integer NOT NULL,
	"stripe_payment_id" varchar(255),
	"price_in_cents" integer,
	"currency" varchar(3),
	"package_name" varchar(100),
	"speaking_test_id" varchar(255),
	"credit_cost" integer,
	"status" "jas_transaction_status" DEFAULT 'PENDING' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jas_page_content" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"type" "jas_content_type" NOT NULL,
	"content" text NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jas_rate_limit" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"ip_address" varchar(255) NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"last_request_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jas_session" (
	"session_token" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "jas_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"username" varchar(50),
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"gender" "jas_gender",
	"age" integer,
	"nationality" varchar(100),
	"hobbies" jsonb,
	"goal_band" numeric(3, 1) DEFAULT 5,
	"current_band" numeric(3, 1) DEFAULT 0,
	"credits" integer DEFAULT 0 NOT NULL,
	"role" "jas_user_role" DEFAULT 'USER' NOT NULL,
	"status" "jas_user_status" DEFAULT 'PENDING' NOT NULL,
	"email_verified" timestamp with time zone,
	"image" varchar(255),
	"theme" "jas_theme" DEFAULT 'light' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"profile_completed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "jas_user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "jas_verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "jas_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "jas_account" ADD CONSTRAINT "jas_account_user_id_jas_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."jas_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jas_credit_transaction" ADD CONSTRAINT "jas_credit_transaction_user_id_jas_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."jas_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jas_credit_transaction" ADD CONSTRAINT "jas_credit_transaction_speaking_test_id_jas_speaking_test_id_fk" FOREIGN KEY ("speaking_test_id") REFERENCES "public"."jas_speaking_test"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jas_page_content" ADD CONSTRAINT "jas_page_content_created_by_id_jas_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."jas_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jas_session" ADD CONSTRAINT "jas_session_user_id_jas_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."jas_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jas_speaking_test" ADD CONSTRAINT "jas_speaking_test_user_id_jas_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."jas_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "jas_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_transaction_user_id_idx" ON "jas_credit_transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_transaction_stripe_payment_id_idx" ON "jas_credit_transaction" USING btree ("stripe_payment_id");--> statement-breakpoint
CREATE INDEX "credit_transaction_speaking_test_id_idx" ON "jas_credit_transaction" USING btree ("speaking_test_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "jas_session" USING btree ("user_id");