import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { conversationRowSelect } from "./row-select";
import type { ListConversationsInput } from "./schemas";

export async function listConversationsInOrganization(
  filters: ListConversationsInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  return db.conversation.findMany({
    where: {
      organizationId: filters.organizationId,
      ...(filters.contactId !== undefined
        ? { contactId: filters.contactId }
        : {}),
    },
    select: conversationRowSelect,
    // Inbox view: most-recent activity first; conversations with no messages
    // (lastMessageAt is null) sort last, then break ties by creation order.
    orderBy: [
      { lastMessageAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
      { id: "desc" },
    ],
    take: filters.limit,
    skip: filters.offset,
  });
}
