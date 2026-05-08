import { createHash } from "node:crypto";

import { createId } from "@paralleldrive/cuid2";
import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export function hashResetToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function generateResetToken() {
  const raw = new Uint8Array(32);
  crypto.getRandomValues(raw);
  return Buffer.from(raw).toString("base64url");
}

/**
 * Create a fresh password-reset token for a user. Marks any prior un-consumed
 * tokens for that user as consumed, so only one outstanding link works at a time.
 * The plaintext token is returned (for the email URL); only the SHA-256 hash is
 * persisted.
 */
export async function createPasswordResetToken(
  params: {
    userId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
  tx: PrismaTransaction | PrismaClient = prisma,
) {
  const now = new Date();
  await tx.passwordResetToken.updateMany({
    where: { userId: params.userId, consumedAt: null },
    data: { consumedAt: now },
  });

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TTL_MS);

  await tx.passwordResetToken.create({
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
