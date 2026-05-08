import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { conversationRowSelect } from "./row-select";
import type { ConversationByIdInput } from "./schemas";

export async function getConversationInOrganization(
  params: ConversationByIdInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  return db.conversation.findFirst({
    where: {
      id: params.id,
      organizationId: params.organizationId,
    },
    select: conversationRowSelect,
  });
}

export async function getConversationByContactId(
  params: { contactId: string; organizationId: string },
  db: PrismaTransaction | PrismaClient = prisma,
) {
  return db.conversation.findFirst({
    where: {
      contactId: params.contactId,
      organizationId: params.organizationId,
    },
    select: conversationRowSelect,
  });
}
