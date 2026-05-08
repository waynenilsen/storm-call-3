import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { activityRowSelect } from "./row-select";
import type { ListActivitiesInput } from "./schemas";

export async function listActivitiesInOrganization(
  filters: ListActivitiesInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const createdAtFilter: { gte?: Date; lte?: Date } = {};
  if (filters.since) createdAtFilter.gte = filters.since;
  if (filters.until) createdAtFilter.lte = filters.until;

  return db.activity.findMany({
    where: {
      organizationId: filters.organizationId,
      ...(filters.resourceType !== undefined && {
        resourceType: filters.resourceType,
      }),
      ...(filters.resourceId !== undefined && {
        resourceId: filters.resourceId,
      }),
      ...(filters.actorUserId !== undefined && {
        actorUserId: filters.actorUserId,
      }),
      ...(filters.action !== undefined && { action: filters.action }),
      ...(Object.keys(createdAtFilter).length > 0 && {
        createdAt: createdAtFilter,
      }),
    },
    select: activityRowSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: filters.limit,
    skip: filters.offset,
  });
}
