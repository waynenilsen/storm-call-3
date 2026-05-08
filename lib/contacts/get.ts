import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { contactRowSelect } from "./row-select";
import type { ContactByIdInput } from "./schemas";

export async function getContactInOrganization(
  params: ContactByIdInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  return db.contact.findFirst({
    where: {
      id: params.id,
      organizationId: params.organizationId,
    },
    select: contactRowSelect,
  });
}
