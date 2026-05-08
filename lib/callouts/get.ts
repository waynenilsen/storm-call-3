import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { calloutRowSelect } from "./row-select";
import type { CalloutByIdInput } from "./schemas";

export async function getCalloutInOrganization(
  params: CalloutByIdInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  return db.callout.findFirst({
    where: {
      id: params.id,
      organizationId: params.organizationId,
    },
    select: calloutRowSelect,
  });
}
