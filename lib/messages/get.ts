import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { messageRowSelect } from "./row-select";
import type { MessageByIdInput } from "./schemas";

export async function getMessageInOrganization(
  params: MessageByIdInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  return db.message.findFirst({
    where: {
      id: params.id,
      organizationId: params.organizationId,
    },
    select: messageRowSelect,
  });
}
