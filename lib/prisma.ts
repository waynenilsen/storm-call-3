import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type PrismaClient as PrismaClientType,
} from "@prisma/client";

/** `tx` in `prisma.$transaction(async (tx) => ...)`. */
export type PrismaTransaction = Parameters<
  Parameters<PrismaClientType["$transaction"]>[0]
>[0];

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
