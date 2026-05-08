import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import type { ListOrganizationsInput, OrgRole } from "./schemas";

export async function listOrganizationsForUser(
  userId: string,
  filters: ListOrganizationsInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const search = filters.search?.trim();
  const rows = await db.organization.findMany({
    where: {
      memberships: { some: { userId } },
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      url: true,
      createdAt: true,
      updatedAt: true,
      memberships: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit,
    skip: filters.offset,
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    url: row.url,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    role: (row.memberships[0]?.role ?? null) as OrgRole | null,
  }));
}
