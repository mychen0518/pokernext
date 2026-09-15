/**
 * @fileoverview Drizzle schema. drizzle-kit generates the SQL migrations in
 * `packages/db/migrations/` from this file; uniqueness invariants are declared
 * here so they land in the migrations, not only in application checks.
 */

import {WORKSPACES} from '@pokernext/domain';
import {sql} from 'drizzle-orm';
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

/** Writes fixed identifiers as a SQL list of string literals: `'a', 'b'`. */
function sqlStringList(values: readonly string[]): string {
  return values.map(value => `'${value.replaceAll("'", "''")}'`).join(', ');
}

/** One recorded health check, written once per request key. */
export const healthChecks = pgTable(
  'health_checks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requestKey: text('request_key').notNull(),
    recordedAt: timestamp('recorded_at', {withTimezone: true}).notNull(),
  },
  table => [
    // Parallel resends of one request must leave exactly one record.
    unique('health_checks_request_key_unique').on(table.requestKey),
  ],
);

/**
 * A member (會員) or work account (工作帳號) and the one workspace it belongs
 * to. Tickets 03 and 10 add credentials, invitations and OTP to this same
 * table; migrations never insert account rows (ADR-0001).
 */
export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: text('kind').notNull(),
    displayName: text('display_name').notNull(),
    workspace: text('workspace').notNull(),
    // Role within the workspace as shown to people, such as 天城業務.
    roleLabel: text('role_label').notNull(),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull(),
  },
  table => [
    check('accounts_kind_known', sql`${table.kind} IN ('member', 'work')`),
    check(
      'accounts_workspace_known',
      sql`${table.workspace} IN (${sql.raw(sqlStringList(WORKSPACES))})`,
    ),
    // Members belong to the player workspace, work accounts to the others.
    check(
      'accounts_kind_matches_workspace',
      sql`(${table.kind} = 'member') = (${table.workspace} = 'player')`,
    ),
  ],
);

/**
 * A signed-in session on one host. Only a hash of the opaque cookie token is
 * stored; ending a session sets `ended_at` and keeps the row.
 */
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenHash: text('token_hash').notNull(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id),
    hostKind: text('host_kind').notNull(),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull(),
    endedAt: timestamp('ended_at', {withTimezone: true}),
  },
  table => [
    unique('sessions_token_hash_unique').on(table.tokenHash),
    index('sessions_account_id_index').on(table.accountId),
    check(
      'sessions_host_kind_known',
      sql`${table.hostKind} IN ('player', 'work')`,
    ),
  ],
);

/**
 * The AuditLog (PRD 7 SEC-01): one row per audited decision, appended and
 * never updated or deleted. This first cut records refused session and
 * workspace requests; ticket 03 extends the same table and its flows
 * (invitations, sign-in steps, successful operations). Rows carry ids and
 * reasons only, never tokens, credentials or document numbers.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // The application clock's time, not the database server's.
    occurredAt: timestamp('occurred_at', {withTimezone: true}).notNull(),
    // Null when nobody is identified, such as a request without a session.
    actorAccountId: uuid('actor_account_id'),
    hostKind: text('host_kind').notNull(),
    // What was attempted, such as `workspace.enter`.
    action: text('action').notNull(),
    // What it was attempted on, such as `workspace:venue`.
    target: text('target').notNull(),
    outcome: text('outcome').notNull(),
    // The rule's refusal reason; null when the decision allowed it.
    reason: text('reason'),
  },
  table => [
    index('audit_log_occurred_at_index').on(table.occurredAt),
    check(
      'audit_log_host_kind_known',
      sql`${table.hostKind} IN ('player', 'work')`,
    ),
    check(
      'audit_log_outcome_known',
      sql`${table.outcome} IN ('allowed', 'refused')`,
    ),
  ],
);
