import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { employeeRowSelect } from "./row-select";
import type { EmployeeByIdInput } from "./schemas";

export async function getEmployeeInOrganization(
  params: EmployeeByIdInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  return db.employee.findFirst({
    where: {
      id: params.id,
      organizationId: params.organizationId,
    },
    select: employeeRowSelect,
  });
}
