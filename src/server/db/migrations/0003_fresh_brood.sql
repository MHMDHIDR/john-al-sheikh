CREATE TABLE "jas_authenticator" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"credential_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"credential_public_key" text NOT NULL,
	"counter" integer NOT NULL,
	"credential_device_type" varchar(255) NOT NULL,
	"credential_backed_up" boolean NOT NULL,
	"transports" varchar(255),
	CONSTRAINT "jas_authenticator_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
ALTER TABLE "jas_authenticator" ADD CONSTRAINT "jas_authenticator_user_id_jas_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."jas_user"("id") ON DELETE cascade ON UPDATE no action;