import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import type { UpdateOrganizationInput } from "./schemas";

export async function updateOrganization(
  params: UpdateOrganizationInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  return db.organization.update({
    where: { id: params.id },
    data: { name: params.name },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
