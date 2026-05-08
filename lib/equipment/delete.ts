import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import type { EquipmentByIdInput } from "./schemas";

export async function deleteEquipment(
  params: EquipmentByIdInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const result = await db.equipment.deleteMany({
    where: {
      id: params.id,
      organizationId: params.organizationId,
    },
  });
  if (result.count === 0) return { ok: false as const };
  return { ok: true as const };
}
