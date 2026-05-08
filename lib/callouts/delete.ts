import type { PrismaClient } from "@prisma/client";

import { recordActivity } from "../activity/record";
import { ACTIVITY_ACTION, RESOURCE_TYPE } from "../activity/schemas";
import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import type { CalloutByIdInput } from "./schemas";

export async function deleteCallout(
  params: CalloutByIdInput & { actingUserId: string },
  tx?: PrismaTransaction,
) {
  const run = async (runner: PrismaTransaction | PrismaClient) => {
    const existing = await runner.callout.findFirst({
      where: { id: params.id, organizationId: params.organizationId },
      select: { id: true, name: true },
    });
    if (!existing) return { ok: false as const };

    await runner.callout.delete({ where: { id: existing.id } });

    await recordActivity(
      {
        organizationId: params.organizationId,
        actorUserId: params.actingUserId,
        action: ACTIVITY_ACTION.CALLOUT_DELETED,
        resourceType: RESOURCE_TYPE.CALLOUT,
        resourceId: existing.id,
        resourceLabel: existing.name,
      },
      runner as PrismaTransaction,
    );

    return { ok: true as const };
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
