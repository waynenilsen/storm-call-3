import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { messageRowSelect } from "./row-select";
import type { ListMessagesInput } from "./schemas";

/**
 * Thread view: most recent first. Both organizationId and conversationId are
 * required filters so a leaked conversationId can't be read by another org.
 */
export async function listMessagesInConversation(
  filters: ListMessagesInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  return db.message.findMany({
    where: {
      organizationId: filters.organizationId,
      conversationId: filters.conversationId,
    },
    select: messageRowSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: filters.limit,
    skip: filters.offset,
  });
}
