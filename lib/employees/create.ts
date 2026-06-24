import { createId } from "@paralleldrive/cuid2";
import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { employeeRowSelect } from "./row-select";
import type { CreateEmployeeInput } from "./schemas";

export class ContactNotInOrganizationError extends Error {
  constructor() {
    super("contact not found in organization");
    this.name = "ContactNotInOrganizationError";
  }
}

export async function createEmployee(
  params: CreateEmployeeInput & { actingUserId: string },
  tx?: PrismaTransaction,
) {
  const run = async (runner: PrismaTransaction | PrismaClient) => {
    const actor = await runner.user.findUniqueOrThrow({
      where: { id: params.actingUserId },
      select: { id: true, name: true },
    });

    const contact = await runner.contact.findFirst({
      where: { id: params.contactId, organizationId: params.organizationId },
      select: { id: true },
    });
    if (!contact) throw new ContactNotInOrganizationError();

    return runner.employee.create({
      data: {
        id: createId(),
        organizationId: params.organizationId,
        contactId: params.contactId,
        notes: params.notes,
        createdByUserId: actor.id,
        updatedByUserId: actor.id,
        createdByUserName: actor.name,
        updatedByUserName: actor.name,
      },
      select: employeeRowSelect,
    });
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
