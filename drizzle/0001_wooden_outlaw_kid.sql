CREATE TABLE "cron_run_log" (
	"id" text PRIMARY KEY NOT NULL,
	"run_at" timestamp NOT NULL,
	"reminders_attempted" integer DEFAULT 0 NOT NULL,
	"reminders_succeeded" integer DEFAULT 0 NOT NULL,
	"reminders_failed" integer DEFAULT 0 NOT NULL,
	"error_details" text,
	"duration_ms" integer
);
