CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"display_name" text NOT NULL,
	"workspace" text NOT NULL,
	"role_label" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "accounts_kind_known" CHECK ("accounts"."kind" IN ('member', 'work')),
	CONSTRAINT "accounts_workspace_known" CHECK ("accounts"."workspace" IN ('player', 'venue', 'admin', 'platform', 'staff', 'agent')),
	CONSTRAINT "accounts_kind_matches_workspace" CHECK (("accounts"."kind" = 'member') = ("accounts"."workspace" = 'player'))
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"account_id" uuid NOT NULL,
	"host_kind" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "sessions_host_kind_known" CHECK ("sessions"."host_kind" IN ('player', 'work'))
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_account_id_index" ON "sessions" USING btree ("account_id");