import type { PrismaClient } from "@prisma/client";

import { recordActivity } from "../activity/record";
import { ACTIVITY_ACTION, RESOURCE_TYPE } from "../activity/schemas";
import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { equipmentRowSelect } from "./row-select";
import type {
  MechanicalStatus,
  ToolStatus,
  UpdateEquipmentInput,
} from "./schemas";

export class EquipmentNotInOrganizationError extends Error {
  constructor() {
    super("equipment not found in organization");
    this.name = "EquipmentNotInOrganizationError";
  }
}

export async function updateEquipment(
  params: UpdateEquipmentInput & { actingUserId: string },
  tx?: PrismaTransaction,
) {
  const run = async (runner: PrismaTransaction | PrismaClient) => {
    const actor = await runner.user.findUniqueOrThrow({
      where: { id: params.actingUserId },
      select: { id: true, name: true },
    });

    const existing = await runner.equipment.findFirst({
      where: {
        id: params.id,
        organizationId: params.organizationId,
      },
      select: { id: true },
    });
    if (!existing) throw new EquipmentNotInOrganizationError();

    const data: {
      companyCode?: string | null;
      type?: string | null;
      subtype?: string | null;
      mechanicalStatus?: MechanicalStatus | null;
      toolStatus?: ToolStatus | null;
      notes?: string | null;
      updatedByUserId: string;
      updatedByUserName: string;
    } = {
      updatedByUserId: actor.id,
      updatedByUserName: actor.name,
    };
    const changedFields: string[] = [];
    if (params.companyCode !== undefined) {
      data.companyCode = params.companyCode;
      changedFields.push("companyCode");
    }
    if (params.type !== undefined) {
      data.type = params.type;
      changedFields.push("type");
    }
    if (params.subtype !== undefined) {
      data.subtype = params.subtype;
      changedFields.push("subtype");
    }
    if (params.mechanicalStatus !== undefined) {
      data.mechanicalStatus = params.mechanicalStatus;
      changedFields.push("mechanicalStatus");
    }
    if (params.toolStatus !== undefined) {
      data.toolStatus = params.toolStatus;
      changedFields.push("toolStatus");
    }
    if (params.notes !== undefined) {
      data.notes = params.notes;
      changedFields.push("notes");
    }

    const equipment = await runner.equipment.update({
      where: { id: params.id },
      data,
      select: equipmentRowSelect,
    });

    await recordActivity(
      {
        organizationId: params.organizationId,
        actorUserId: actor.id,
        actorUserName: actor.name,
        action: ACTIVITY_ACTION.EQUIPMENT_UPDATED,
        resourceType: RESOURCE_TYPE.EQUIPMENT,
        resourceId: equipment.id,
        resourceLabel: equipment.companyCode,
        metadata: { changedFields },
      },
      runner as PrismaTransaction,
    );

    return equipment;
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
