/**
 * @fileoverview drizzle-kit config: generates SQL migrations from the schema.
 * Run `pnpm --filter @pokernext/db db:generate -- --name <change>`.
 */

import {defineConfig} from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/schema.ts',
  out: './migrations',
});
