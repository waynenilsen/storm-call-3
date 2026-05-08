import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { calloutRowSelect } from "./row-select";
import type { ListCalloutsInput } from "./schemas";

export async function listCalloutsInOrganization(
  filters: ListCalloutsInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const search = filters.search?.trim();
  const searchFilter =
    search === undefined || search.length === 0
      ? {}
      : {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            {
              messageText: { contains: search, mode: "insensitive" as const },
            },
          ],
        };

  return db.callout.findMany({
    where: {
      organizationId: filters.organizationId,
      ...searchFilter,
    },
    select: calloutRowSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: filters.limit,
    skip: filters.offset,
  });
}
