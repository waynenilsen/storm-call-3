import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { equipmentRowSelect } from "./row-select";
import type { EquipmentByIdInput } from "./schemas";

export async function getEquipmentInOrganization(
  params: EquipmentByIdInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  return db.equipment.findFirst({
    where: {
      id: params.id,
      organizationId: params.organizationId,
    },
    select: equipmentRowSelect,
  });
}
