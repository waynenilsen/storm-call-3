import type { PrismaClient } from "@prisma/client";

import { recordActivity } from "../activity/record";
import { ACTIVITY_ACTION, RESOURCE_TYPE } from "../activity/schemas";
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
  tx?: PrismaTransaction,
) {
  const run = async (runner: PrismaTransaction | PrismaClient) => {
    const actor = await runner.user.findUniqueOrThrow({
      where: { id: params.actingUserId },
      select: { id: true, name: true },
    });

    const existing = await runner.callout.findFirst({
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
    const changedFields: string[] = [];
    if (params.name !== undefined) {
      data.name = params.name;
      changedFields.push("name");
    }
    if (params.messageText !== undefined) {
      data.messageText = params.messageText;
      changedFields.push("messageText");
    }

    const callout = await runner.callout.update({
      where: { id: params.id },
      data,
      select: calloutRowSelect,
    });

    await recordActivity(
      {
        organizationId: params.organizationId,
        actorUserId: actor.id,
        actorUserName: actor.name,
        action: ACTIVITY_ACTION.CALLOUT_UPDATED,
        resourceType: RESOURCE_TYPE.CALLOUT,
        resourceId: callout.id,
        resourceLabel: callout.name,
        metadata: { changedFields },
      },
      runner as PrismaTransaction,
    );

    return callout;
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
