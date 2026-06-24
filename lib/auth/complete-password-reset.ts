import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { hashPassword } from "./password";
import { hashResetToken } from "./password-reset-token";
import type { CompletePasswordResetInput } from "./schemas";

export type CompletePasswordResetResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "consumed" };

export async function completePasswordReset(
  input: CompletePasswordResetInput,
  tx?: PrismaTransaction,
): Promise<CompletePasswordResetResult> {
  const tokenHash = hashResetToken(input.token);

  const run = async (
    runner: PrismaTransaction | PrismaClient,
  ): Promise<CompletePasswordResetResult> => {
    const row = await runner.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        consumedAt: true,
      },
    });

    if (!row) return { ok: false, reason: "invalid" };
    if (row.consumedAt) return { ok: false, reason: "consumed" };

    const now = new Date();
    if (row.expiresAt.getTime() <= now.getTime()) {
      return { ok: false, reason: "expired" };
    }

    const passwordHash = await hashPassword(input.password);

    await runner.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    });

    await runner.passwordResetToken.update({
      where: { id: row.id },
      data: { consumedAt: now },
    });

    // Invalidate all other live sessions so password recovery acts as a forced
    // sign-out — important if the account was compromised.
    await runner.session.updateMany({
      where: { userId: row.userId, revokedAt: null },
      data: { revokedAt: now },
    });

    return { ok: true };
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
