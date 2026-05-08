import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { equipmentRowSelect } from "./row-select";
import type { ListEquipmentInput } from "./schemas";

export async function listEquipmentInOrganization(
  filters: ListEquipmentInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const search = filters.search?.trim();
  const searchFilter =
    search === undefined || search.length === 0
      ? {}
      : {
          OR: [
            { companyCode: { contains: search, mode: "insensitive" as const } },
            { type: { contains: search, mode: "insensitive" as const } },
            { subtype: { contains: search, mode: "insensitive" as const } },
            { notes: { contains: search, mode: "insensitive" as const } },
          ],
        };

  return db.equipment.findMany({
    where: {
      organizationId: filters.organizationId,
      ...(filters.mechanicalStatus !== undefined && {
        mechanicalStatus: filters.mechanicalStatus,
      }),
      ...(filters.toolStatus !== undefined && {
        toolStatus: filters.toolStatus,
      }),
      ...(filters.type !== undefined && { type: filters.type }),
      ...searchFilter,
    },
    select: equipmentRowSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: filters.limit,
    skip: filters.offset,
  });
}
