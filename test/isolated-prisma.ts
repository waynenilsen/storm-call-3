import { createId } from "@paralleldrive/cuid2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import {
  createDatabaseFromTemplate,
  dropDatabaseIfExists,
  terminateOtherConnectionsToDatabase,
} from "./isolated-postgres";
import {
  getDatabaseNameFromUrl,
  maintenanceDatabaseUrl,
  replaceDatabaseInUrl,
} from "./parse-database-url";

function loadEnv(): void {
  try {
    process.loadEnvFile();
  } catch {
    // `.env` may be absent in some tooling contexts
  }
}

export type IsolatedPrismaContext = {
  prisma: PrismaClient;
  /** Closes Prisma, drops the isolated database, closes admin connection. */
  dispose: () => Promise<void>;
};

/**
 * Creates a fresh PostgreSQL database cloned from the Prisma DATABASE_URL database
 * (must already be migrated, and seeded when your tests require seed data), wires a
 * dedicated {@link PrismaClient}, and returns {@link dispose} to tear it down.
 *
 * Use one {@link createIsolatedPrisma} (or {@link withIsolatedPrisma}) per **test**
 * so parallel runs never share writable state.
 */
export async function createIsolatedPrisma(): Promise<IsolatedPrismaContext> {
  loadEnv();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for isolated Prisma tests");
  }

  const templateName = getDatabaseNameFromUrl(databaseUrl);
  const isolatedName = `iso_${createId()}`;

  const admin = new pg.Client({
    connectionString: maintenanceDatabaseUrl(databaseUrl),
  });
  await admin.connect();

  try {
    await terminateOtherConnectionsToDatabase(admin, templateName);
    await createDatabaseFromTemplate({
      admin,
      newDatabaseName: isolatedName,
      templateDatabaseName: templateName,
    });
  } catch (e) {
    await admin.end().catch(() => {});
    throw e;
  }

  const isolatedUrl = replaceDatabaseInUrl(databaseUrl, isolatedName);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: isolatedUrl }),
  });

  let disposed = false;
  const dispose = async () => {
    if (disposed) {
      return;
    }
    disposed = true;
    await prisma.$disconnect();
    await dropDatabaseIfExists(admin, isolatedName);
    await admin.end();
  };

  return { prisma, dispose };
}

export async function withIsolatedPrisma<T>(
  fn: (prisma: PrismaClient) => Promise<T>,
): Promise<T> {
  const { prisma, dispose } = await createIsolatedPrisma();
  try {
    return await fn(prisma);
  } finally {
    await dispose();
  }
}
