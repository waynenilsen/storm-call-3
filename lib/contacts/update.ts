import type { PrismaClient } from "@prisma/client";

import { recordActivity } from "../activity/record";
import { ACTIVITY_ACTION, RESOURCE_TYPE } from "../activity/schemas";
import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { normalizeIncomingUsPhoneToE164 } from "./phone-us";
import { contactRowSelect } from "./row-select";
import type { UpdateContactInput } from "./schemas";

export class ContactNotInOrganizationError extends Error {
  constructor() {
    super("contact not found in organization");
    this.name = "ContactNotInOrganizationError";
  }
}

export async function updateContact(
  params: UpdateContactInput & { actingUserId: string },
  tx?: PrismaTransaction,
) {
  const run = async (runner: PrismaTransaction | PrismaClient) => {
    const actor = await runner.user.findUniqueOrThrow({
      where: { id: params.actingUserId },
      select: { id: true, name: true },
    });

    const existing = await runner.contact.findFirst({
      where: {
        id: params.id,
        organizationId: params.organizationId,
      },
      select: { id: true },
    });
    if (!existing) throw new ContactNotInOrganizationError();

    const data: {
      name?: string;
      email?: string;
      phone?: string;
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
    if (params.email !== undefined) {
      data.email = params.email;
      changedFields.push("email");
    }
    if (params.phone !== undefined) {
      data.phone = normalizeIncomingUsPhoneToE164(params.phone);
      changedFields.push("phone");
    }

    const contact = await runner.contact.update({
      where: { id: params.id },
      data,
      select: contactRowSelect,
    });

    await recordActivity(
      {
        organizationId: params.organizationId,
        actorUserId: actor.id,
        actorUserName: actor.name,
        action: ACTIVITY_ACTION.CONTACT_UPDATED,
        resourceType: RESOURCE_TYPE.CONTACT,
        resourceId: contact.id,
        resourceLabel: contact.name,
        metadata: { changedFields },
      },
      runner as PrismaTransaction,
    );

    return contact;
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
