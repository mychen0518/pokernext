/**
 * @fileoverview Drizzle schema. drizzle-kit generates the SQL migrations in
 * `packages/db/migrations/` from this file; uniqueness invariants are declared
 * here so they land in the migrations, not only in application checks.
 */

import {pgTable, text, timestamp, unique, uuid} from 'drizzle-orm/pg-core';

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
