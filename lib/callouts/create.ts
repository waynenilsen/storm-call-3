import { createId } from "@paralleldrive/cuid2";
import type { PrismaClient } from "@prisma/client";

import { recordActivity } from "../activity/record";
import { ACTIVITY_ACTION, RESOURCE_TYPE } from "../activity/schemas";
import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { calloutRowSelect } from "./row-select";
import type { CreateCalloutInput } from "./schemas";

export async function createCallout(
  params: CreateCalloutInput & { actingUserId: string },
  tx?: PrismaTransaction,
) {
  const run = async (runner: PrismaTransaction | PrismaClient) => {
    const actor = await runner.user.findUniqueOrThrow({
      where: { id: params.actingUserId },
      select: { id: true, name: true },
    });

    const callout = await runner.callout.create({
      data: {
        id: createId(),
        organizationId: params.organizationId,
        name: params.name,
        messageText: params.messageText,
        createdByUserId: actor.id,
        updatedByUserId: actor.id,
        createdByUserName: actor.name,
        updatedByUserName: actor.name,
      },
      select: calloutRowSelect,
    });

    await recordActivity(
      {
        organizationId: params.organizationId,
        actorUserId: actor.id,
        actorUserName: actor.name,
        action: ACTIVITY_ACTION.CALLOUT_CREATED,
        resourceType: RESOURCE_TYPE.CALLOUT,
        resourceId: callout.id,
        resourceLabel: callout.name,
      },
      runner as PrismaTransaction,
    );

    return callout;
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
