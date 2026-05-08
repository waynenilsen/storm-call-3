import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import type { OrgRole } from "./schemas";

export async function getMembership(
  params: { userId: string; organizationId: string },
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const row = await db.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId: params.userId,
        organizationId: params.organizationId,
      },
    },
    select: {
      id: true,
      userId: true,
      organizationId: true,
      role: true,
    },
  });
  if (!row) return null;
  return { ...row, role: row.role as OrgRole };
}
