import type { PrismaClient } from "@prisma/client";

import { recordActivity } from "../activity/record";
import { ACTIVITY_ACTION, RESOURCE_TYPE } from "../activity/schemas";
import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import type { ContactByIdInput } from "./schemas";

export async function deleteContact(
  params: ContactByIdInput & { actingUserId: string },
  tx?: PrismaTransaction,
) {
  const run = async (runner: PrismaTransaction | PrismaClient) => {
    const existing = await runner.contact.findFirst({
      where: { id: params.id, organizationId: params.organizationId },
      select: { id: true, name: true },
    });
    if (!existing) return { ok: false as const };

    await runner.contact.delete({ where: { id: existing.id } });

    await recordActivity(
      {
        organizationId: params.organizationId,
        actorUserId: params.actingUserId,
        action: ACTIVITY_ACTION.CONTACT_DELETED,
        resourceType: RESOURCE_TYPE.CONTACT,
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
