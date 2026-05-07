/**
 * Helpers for DATABASE_URL (Prisma default PG URL).
 * Used by the parallel DB harness to clone the migrated template DB per test.
 */

/** PostgreSQL connection URLs are not always accepted by `URL`; normalize the scheme for parsing. */
export function toUrlParseableConnectionString(
  connectionString: string,
): string {
  return connectionString.replace(/^postgres(ql)?:/i, "http:");
}

export function fromUrlParseableConnectionString(
  connectionString: string,
  originalPrefix: "postgres" | "postgresql",
): string {
  return connectionString.replace(/^http:/i, `${originalPrefix}:`);
}

function originalScheme(connectionString: string): "postgres" | "postgresql" {
  return /^postgresql:/i.test(connectionString) ? "postgresql" : "postgres";
}

/** Returns the database name segment from the path (decoded). */
export function getDatabaseNameFromUrl(databaseUrl: string): string {
  const u = new URL(toUrlParseableConnectionString(databaseUrl));
  const segment = u.pathname.replace(/^\//, "").split("/")[0];
  if (!segment) {
    throw new Error(
      "DATABASE_URL must include a database name (e.g. postgresql://user:pass@host:5432/mydb)",
    );
  }
  return decodeURIComponent(segment);
}

/** Same cluster/credentials, different database name. */
export function replaceDatabaseInUrl(
  databaseUrl: string,
  newDatabaseName: string,
): string {
  const prefix = originalScheme(databaseUrl);
  const u = new URL(toUrlParseableConnectionString(databaseUrl));
  u.pathname = `/${encodeURIComponent(newDatabaseName)}`;
  return fromUrlParseableConnectionString(u.toString(), prefix);
}

/** Connect to the maintenance DB (`postgres`) to run CREATE/DROP DATABASE. */
export function maintenanceDatabaseUrl(databaseUrl: string): string {
  return replaceDatabaseInUrl(databaseUrl, "postgres");
}
