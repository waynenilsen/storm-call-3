import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { hashSessionToken } from "./session";

export async function getUserForSessionToken(
  token: string,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const tokenHash = hashSessionToken(token);
  const now = new Date();

  const row = await db.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    select: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          selectedOrganizationId: true,
          createdAt: true,
        },
      },
    },
  });

  return row?.user ?? null;
}
