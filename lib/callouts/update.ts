import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { calloutRowSelect } from "./row-select";
import type { UpdateCalloutInput } from "./schemas";

export class CalloutNotInOrganizationError extends Error {
  constructor() {
    super("callout not found in organization");
    this.name = "CalloutNotInOrganizationError";
  }
}

export async function updateCallout(
  params: UpdateCalloutInput & { actingUserId: string },
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const actor = await db.user.findUniqueOrThrow({
    where: { id: params.actingUserId },
    select: { id: true, name: true },
  });

  const existing = await db.callout.findFirst({
    where: {
      id: params.id,
      organizationId: params.organizationId,
    },
    select: { id: true },
  });
  if (!existing) throw new CalloutNotInOrganizationError();

  const data: {
    name?: string;
    messageText?: string;
    updatedByUserId: string;
    updatedByUserName: string;
  } = {
    updatedByUserId: actor.id,
    updatedByUserName: actor.name,
  };
  if (params.name !== undefined) data.name = params.name;
  if (params.messageText !== undefined) data.messageText = params.messageText;

  return db.callout.update({
    where: { id: params.id },
    data,
    select: calloutRowSelect,
  });
}
