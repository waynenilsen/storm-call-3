import { createId } from "@paralleldrive/cuid2";
import { Prisma } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import type { ActivityAction } from "./schemas";

export type RecordActivityParams = {
  organizationId: string;
  actorUserId: string | null;
  actorUserName?: string | null;
  action: ActivityAction;
  resourceType: string;
  resourceId: string;
  resourceLabel?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

export async function recordActivity(
  params: RecordActivityParams,
  tx: PrismaTransaction,
): Promise<void> {
  let actorUserName = params.actorUserName ?? null;
  if (params.actorUserId && actorUserName === null) {
    const actor = await tx.user.findUnique({
      where: { id: params.actorUserId },
      select: { name: true },
    });
    actorUserName = actor?.name ?? null;
  }

  await tx.activity.create({
    data: {
      id: createId(),
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      actorUserName,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      resourceLabel: params.resourceLabel ?? null,
      metadata:
        params.metadata === null || params.metadata === undefined
          ? Prisma.JsonNull
          : params.metadata,
    },
    select: { id: true },
  });
}
