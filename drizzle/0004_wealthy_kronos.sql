CREATE TABLE "booking_history" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text,
	"patient_email" text,
	"patient_name" text,
	"service_id" text,
	"service_name" text,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"status" text NOT NULL,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"migrated_at" timestamp DEFAULT now() NOT NULL
);
