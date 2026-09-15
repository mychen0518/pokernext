CREATE TABLE "health_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_key" text NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	CONSTRAINT "health_checks_request_key_unique" UNIQUE("request_key")
);
