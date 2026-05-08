import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import type { OrgRole } from "./schemas";

export async function getOrganizationForUserBySlug(
  params: { userId: string; slug: string },
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const row = await db.organization.findFirst({
    where: {
      slug: params.slug,
      memberships: { some: { userId: params.userId } },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      memberships: {
        where: { userId: params.userId },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    role: (row.memberships[0]?.role ?? null) as OrgRole | null,
  };
}
