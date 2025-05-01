CREATE TABLE "jas_subscribed_email" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"fullname" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"ielts_goal" numeric(3, 1) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jas_subscribed_email_email_unique" UNIQUE("email")
);
