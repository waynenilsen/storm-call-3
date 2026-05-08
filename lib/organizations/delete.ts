import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";

export async function deleteOrganization(
  params: { id: string },
  db: PrismaTransaction | PrismaClient = prisma,
) {
  await db.organization.delete({ where: { id: params.id } });
  return { ok: true as const };
}
