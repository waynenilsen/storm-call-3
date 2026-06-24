// TODO(rate-limit): cap requestPasswordReset by IP and by email (e.g. token-bucket
// or DB-tracked attempts) before exposing this to the public internet. Today an
// attacker can spam this endpoint to mailbomb a known address. Out of scope for
// the initial implementation but flagged so it isn't forgotten.

import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { timingPadDummyHash } from "./password";
import { createPasswordResetToken } from "./password-reset-token";
import type { RequestPasswordResetInput } from "./schemas";

/**
 * Result is intentionally always `{ ok: true }` to prevent user enumeration.
 * `emailPayload` is populated only when an account exists; the caller (tRPC
 * router) sends the email *after* the surrounding transaction commits so a
 * rolled-back DB write never produces an outbound email.
 */
export type RequestPasswordResetResult = {
  ok: true;
  emailPayload: {
    email: string;
    name: string;
    token: string;
    expiresAt: Date;
  } | null;
};

export async function requestPasswordReset(
  input: RequestPasswordResetInput,
  tx?: PrismaTransaction,
  meta?: { ipAddress?: string | null; userAgent?: string | null },
): Promise<RequestPasswordResetResult> {
  const run = async (
    runner: PrismaTransaction | PrismaClient,
  ): Promise<RequestPasswordResetResult> => {
    const user = await runner.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      // Even out timing with the happy path's bcrypt-comparable work. We can't
      // perfectly mask the DB write below, but this avoids the much larger
      // signal of "no work happened at all".
      await timingPadDummyHash;
      return { ok: true, emailPayload: null };
    }

    const { token, expiresAt } = await createPasswordResetToken(
      {
        userId: user.id,
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
      },
      runner,
    );

    return {
      ok: true,
      emailPayload: {
        email: user.email,
        name: user.name,
        token,
        expiresAt,
      },
    };
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
