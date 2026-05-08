import { createId } from "@paralleldrive/cuid2";
import type { PrismaClient } from "@prisma/client";

import { recordActivity } from "../activity/record";
import { ACTIVITY_ACTION, RESOURCE_TYPE } from "../activity/schemas";
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
  params: CreateConversationInput & { actingUserId?: string },
  tx?: PrismaTransaction,
) {
  const run = async (runner: PrismaTransaction | PrismaClient) => {
    const contact = await runner.contact.findFirst({
      where: { id: params.contactId, organizationId: params.organizationId },
      select: { id: true, name: true },
    });
    if (!contact) throw new ContactNotInOrganizationForConversationError();

    const conversation = await runner.conversation.create({
      data: {
        id: createId(),
        organizationId: params.organizationId,
        contactId: params.contactId,
      },
      select: conversationRowSelect,
    });

    await recordActivity(
      {
        organizationId: params.organizationId,
        actorUserId: params.actingUserId ?? null,
        action: ACTIVITY_ACTION.CONVERSATION_CREATED,
        resourceType: RESOURCE_TYPE.CONVERSATION,
        resourceId: conversation.id,
        resourceLabel: contact.name,
      },
      runner as PrismaTransaction,
    );

    return conversation;
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
