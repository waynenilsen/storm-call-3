import { createHash } from "node:crypto";

import { createId } from "@paralleldrive/cuid2";
import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";

export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function generateSessionToken() {
  const raw = new Uint8Array(32);
  crypto.getRandomValues(raw);
  return Buffer.from(raw).toString("base64url");
}

export async function createSession(
  params: {
    userId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
  tx: PrismaTransaction | PrismaClient = prisma,
) {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await tx.session.create({
    data: {
      id: createId(),
      userId: params.userId,
      tokenHash,
      expiresAt,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  });

  return { token, expiresAt };
}
