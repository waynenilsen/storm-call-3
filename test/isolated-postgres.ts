import type pg from "pg";

/**
 * Quote a database name coming from DATABASE_URL (may include hyphens etc.).
 * PostgreSQL limits NAMEDATALEN to 63 bytes for identifiers.
 */
export function quotePgDatabaseName(name: string): string {
  if (name.length < 1 || name.length > 63) {
    throw new Error(
      `Database name must be 1–63 characters, got length ${name.length}`,
    );
  }
  return `"${name.replace(/"/g, '""')}"`;
}

/**
 * Quote isolated DB names produced by this harness only (`iso_` + cuid2).
 */
export function quoteHarnessDatabaseName(name: string): string {
  if (!/^iso_[a-z0-9]{4,56}$/.test(name) || name.length > 63) {
    throw new Error(`Invalid harness database name: ${name}`);
  }
  return `"${name.replace(/"/g, '""')}"`;
}

/**
 * Terminate other sessions connected to `datname` so CREATE DATABASE ... WITH TEMPLATE
 * can proceed. The caller must be connected to a different database (e.g. `postgres`).
 *
 * The migrated template from DATABASE_URL must have no other backends connected during
 * CREATE DATABASE ... WITH TEMPLATE (PostgreSQL requirement).
 */
export async function terminateOtherConnectionsToDatabase(
  admin: pg.Client,
  databaseName: string,
): Promise<void> {
  await admin.query(
    `SELECT pg_terminate_backend(pid)
     FROM pg_stat_activity
     WHERE datname = $1::text
       AND pid <> pg_backend_pid()`,
    [databaseName],
  );
}

export async function createDatabaseFromTemplate(params: {
  admin: pg.Client;
  newDatabaseName: string;
  templateDatabaseName: string;
}): Promise<void> {
  const newDb = quoteHarnessDatabaseName(params.newDatabaseName);
  const templateDb = quotePgDatabaseName(params.templateDatabaseName);
  await params.admin.query(
    `CREATE DATABASE ${newDb} WITH TEMPLATE ${templateDb}`,
  );
}

/** PostgreSQL 13+ — terminates backends on the target DB, then drops. */
export async function dropDatabaseIfExists(
  admin: pg.Client,
  databaseName: string,
): Promise<void> {
  const db = quoteHarnessDatabaseName(databaseName);
  await admin.query(`DROP DATABASE IF EXISTS ${db} WITH (FORCE)`);
}
