import type { PrismaClient } from "@prisma/client";

import { recordActivity } from "../activity/record";
import { ACTIVITY_ACTION, RESOURCE_TYPE } from "../activity/schemas";
import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import type { EquipmentByIdInput } from "./schemas";

export async function deleteEquipment(
  params: EquipmentByIdInput & { actingUserId: string },
  tx?: PrismaTransaction,
) {
  const run = async (runner: PrismaTransaction | PrismaClient) => {
    const existing = await runner.equipment.findFirst({
      where: { id: params.id, organizationId: params.organizationId },
      select: { id: true, companyCode: true },
    });
    if (!existing) return { ok: false as const };

    await runner.equipment.delete({ where: { id: existing.id } });

    await recordActivity(
      {
        organizationId: params.organizationId,
        actorUserId: params.actingUserId,
        action: ACTIVITY_ACTION.EQUIPMENT_DELETED,
        resourceType: RESOURCE_TYPE.EQUIPMENT,
        resourceId: existing.id,
        resourceLabel: existing.companyCode,
      },
      runner as PrismaTransaction,
    );

    return { ok: true as const };
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
