CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"actor_account_id" uuid,
	"host_kind" text NOT NULL,
	"action" text NOT NULL,
	"target" text NOT NULL,
	"outcome" text NOT NULL,
	"reason" text,
	CONSTRAINT "audit_log_host_kind_known" CHECK ("audit_log"."host_kind" IN ('player', 'work')),
	CONSTRAINT "audit_log_outcome_known" CHECK ("audit_log"."outcome" IN ('allowed', 'refused'))
);
--> statement-breakpoint
CREATE INDEX "audit_log_occurred_at_index" ON "audit_log" USING btree ("occurred_at");