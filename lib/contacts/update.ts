import type { PrismaClient } from "@prisma/client";

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
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const actor = await db.user.findUniqueOrThrow({
    where: { id: params.actingUserId },
    select: { id: true, name: true },
  });

  const existing = await db.contact.findFirst({
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
  if (params.name !== undefined) data.name = params.name;
  if (params.email !== undefined) data.email = params.email;
  if (params.phone !== undefined) {
    data.phone = normalizeIncomingUsPhoneToE164(params.phone);
  }

  return db.contact.update({
    where: { id: params.id },
    data,
    select: contactRowSelect,
  });
}
