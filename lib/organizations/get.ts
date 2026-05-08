import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import type { OrgRole } from "./schemas";

export async function getOrganizationForUser(
  params: { organizationId: string; userId: string },
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const row = await db.organization.findFirst({
    where: {
      id: params.organizationId,
      memberships: { some: { userId: params.userId } },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      url: true,
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
    url: row.url,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    role: (row.memberships[0]?.role ?? null) as OrgRole | null,
  };
}
