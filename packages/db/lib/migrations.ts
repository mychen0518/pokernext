/**
 * @fileoverview Applies the committed drizzle-kit SQL migrations.
 */

import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

import {readMigrationFiles} from 'drizzle-orm/migrator';
import {drizzle} from 'drizzle-orm/node-postgres';
import {migrate} from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const MIGRATIONS_FOLDER = fileURLToPath(
  new URL('../migrations', import.meta.url),
);

/** Brings the database at `url` up to the latest committed migration. */
export async function migrateDatabase(url: string): Promise<void> {
  const client = new pg.Client({connectionString: url});
  await client.connect();
  try {
    await migrate(drizzle({client}), {migrationsFolder: MIGRATIONS_FOLDER});
  } finally {
    await client.end();
  }
}

/** Fingerprints the committed migrations; changes whenever any migration does. */
export function migrationsFingerprint(): string {
  const hashes = readMigrationFiles({migrationsFolder: MIGRATIONS_FOLDER}).map(
    migration => migration.hash,
  );
  return createHash('sha256').update(hashes.join('\n')).digest('hex');
}
