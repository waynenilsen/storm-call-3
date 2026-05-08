import { createId } from "@paralleldrive/cuid2";
import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { conversationRowSelect } from "./row-select";
import type { CreateConversationInput } from "./schemas";

export class ContactNotInOrganizationForConversationError extends Error {
  constructor() {
    super("contact not found in organization");
    this.name = "ContactNotInOrganizationForConversationError";
  }
}

export async function createConversation(
  params: CreateConversationInput,
  tx?: PrismaTransaction,
) {
  const run = async (runner: PrismaTransaction | PrismaClient) => {
    const contact = await runner.contact.findFirst({
      where: { id: params.contactId, organizationId: params.organizationId },
      select: { id: true },
    });
    if (!contact) throw new ContactNotInOrganizationForConversationError();

    return runner.conversation.create({
      data: {
        id: createId(),
        organizationId: params.organizationId,
        contactId: params.contactId,
      },
      select: conversationRowSelect,
    });
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
