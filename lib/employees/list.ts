import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { employeeRowSelect } from "./row-select";
import type { ListEmployeesInput } from "./schemas";

export async function listEmployeesInOrganization(
  filters: ListEmployeesInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const search = filters.search?.trim();
  const searchFilter =
    search === undefined || search.length === 0
      ? {}
      : {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        };

  return db.employee.findMany({
    where: {
      organizationId: filters.organizationId,
      ...searchFilter,
    },
    select: employeeRowSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: filters.limit,
    skip: filters.offset,
  });
}
