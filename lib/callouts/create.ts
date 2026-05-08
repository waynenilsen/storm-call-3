import { createId } from "@paralleldrive/cuid2";
import type { PrismaClient } from "@prisma/client";

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

    return runner.callout.create({
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
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
