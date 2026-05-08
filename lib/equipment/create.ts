import { createId } from "@paralleldrive/cuid2";
import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { equipmentRowSelect } from "./row-select";
import type { CreateEquipmentInput } from "./schemas";

export async function createEquipment(
  params: CreateEquipmentInput & { actingUserId: string },
  tx?: PrismaTransaction,
) {
  const run = async (runner: PrismaTransaction | PrismaClient) => {
    const actor = await runner.user.findUniqueOrThrow({
      where: { id: params.actingUserId },
      select: { id: true, name: true },
    });

    return runner.equipment.create({
      data: {
        id: createId(),
        organizationId: params.organizationId,
        companyCode: params.companyCode,
        type: params.type,
        subtype: params.subtype,
        mechanicalStatus: params.mechanicalStatus,
        toolStatus: params.toolStatus,
        notes: params.notes,
        createdByUserId: actor.id,
        updatedByUserId: actor.id,
        createdByUserName: actor.name,
        updatedByUserName: actor.name,
      },
      select: equipmentRowSelect,
    });
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
