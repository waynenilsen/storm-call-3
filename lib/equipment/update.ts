import type { PrismaClient } from "@prisma/client";

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
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const actor = await db.user.findUniqueOrThrow({
    where: { id: params.actingUserId },
    select: { id: true, name: true },
  });

  const existing = await db.equipment.findFirst({
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
  if (params.companyCode !== undefined) data.companyCode = params.companyCode;
  if (params.type !== undefined) data.type = params.type;
  if (params.subtype !== undefined) data.subtype = params.subtype;
  if (params.mechanicalStatus !== undefined)
    data.mechanicalStatus = params.mechanicalStatus;
  if (params.toolStatus !== undefined) data.toolStatus = params.toolStatus;
  if (params.notes !== undefined) data.notes = params.notes;

  return db.equipment.update({
    where: { id: params.id },
    data,
    select: equipmentRowSelect,
  });
}
