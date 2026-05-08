import { createId } from "@paralleldrive/cuid2";
import type { PrismaClient } from "@prisma/client";

import { recordActivity } from "../activity/record";
import { ACTIVITY_ACTION, RESOURCE_TYPE } from "../activity/schemas";
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

    const contact = await runner.contact.create({
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
        // Empty SMS conversation paired 1:1 with the contact. The (org, contact)
        // unique constraint makes this the canonical thread for future messages.
        conversations: {
          create: {
            id: createId(),
            organizationId: params.organizationId,
          },
        },
      },
      select: contactRowSelect,
    });

    await recordActivity(
      {
        organizationId: params.organizationId,
        actorUserId: actor.id,
        actorUserName: actor.name,
        action: ACTIVITY_ACTION.CONTACT_CREATED,
        resourceType: RESOURCE_TYPE.CONTACT,
        resourceId: contact.id,
        resourceLabel: contact.name,
      },
      runner as PrismaTransaction,
    );

    return contact;
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
