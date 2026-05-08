import { createId } from "@paralleldrive/cuid2";
import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { normalizeIncomingUsPhoneToE164 } from "./phone-us";
import { contactRowSelect } from "./row-select";
import type { CreateContactInput } from "./schemas";

export async function createContact(
  params: CreateContactInput & { actingUserId: string },
  tx?: PrismaTransaction,
) {
  const run = async (runner: PrismaTransaction | PrismaClient) => {
    const actor = await runner.user.findUniqueOrThrow({
      where: { id: params.actingUserId },
      select: { id: true, name: true },
    });

    const phone =
      params.phone === undefined
        ? undefined
        : normalizeIncomingUsPhoneToE164(params.phone);

    return runner.contact.create({
      data: {
        id: createId(),
        organizationId: params.organizationId,
        name: params.name,
        email: params.email,
        phone,
        createdByUserId: actor.id,
        updatedByUserId: actor.id,
        createdByUserName: actor.name,
        updatedByUserName: actor.name,
      },
      select: contactRowSelect,
    });
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
