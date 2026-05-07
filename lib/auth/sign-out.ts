import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import type { SignOutInput } from "./schemas";
import { hashSessionToken } from "./session";

export async function signOut(
  params: SignOutInput,
  tx: PrismaTransaction | PrismaClient = prisma,
) {
  const tokenHash = hashSessionToken(params.token);
  const now = new Date();

  const revoked = await tx.session.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    data: { revokedAt: now },
  });

  if (revoked.count > 0) {
    return { ok: true as const };
  }

  const known = await tx.session.findUnique({
    where: { tokenHash },
    select: { id: true },
  });

  if (known) {
    return { ok: true as const };
  }

  return { ok: false as const };
}
