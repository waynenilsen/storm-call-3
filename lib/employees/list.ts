import type { Prisma, PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { employeeRowSelect } from "./row-select";
import type { ListEmployeesInput } from "./schemas";

export async function listEmployeesInOrganization(
  filters: ListEmployeesInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const search = filters.search?.trim();
  const searchFilter: Prisma.EmployeeWhereInput =
    search === undefined || search.length === 0
      ? {}
      : {
          OR: [
            { notes: { contains: search, mode: "insensitive" } },
            { contact: { name: { contains: search, mode: "insensitive" } } },
            { contact: { email: { contains: search, mode: "insensitive" } } },
          ],
        };

  return db.employee.findMany({
    where: {
      organizationId: filters.organizationId,
      ...(filters.contactId !== undefined && { contactId: filters.contactId }),
      ...searchFilter,
    },
    select: employeeRowSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: filters.limit,
    skip: filters.offset,
  });
}
