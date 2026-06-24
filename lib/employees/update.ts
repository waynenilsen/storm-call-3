import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { ContactNotInOrganizationError } from "./create";
import { employeeRowSelect } from "./row-select";
import type { UpdateEmployeeInput } from "./schemas";

export class EmployeeNotInOrganizationError extends Error {
  constructor() {
    super("employee not found in organization");
    this.name = "EmployeeNotInOrganizationError";
  }
}

export async function updateEmployee(
  params: UpdateEmployeeInput & { actingUserId: string },
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const actor = await db.user.findUniqueOrThrow({
    where: { id: params.actingUserId },
    select: { id: true, name: true },
  });

  const existing = await db.employee.findFirst({
    where: {
      id: params.id,
      organizationId: params.organizationId,
    },
    select: { id: true },
  });
  if (!existing) throw new EmployeeNotInOrganizationError();

  if (params.contactId !== undefined) {
    const contact = await db.contact.findFirst({
      where: { id: params.contactId, organizationId: params.organizationId },
      select: { id: true },
    });
    if (!contact) throw new ContactNotInOrganizationError();
  }

  const data: {
    contactId?: string;
    notes?: string | null;
    updatedByUserId: string;
    updatedByUserName: string;
  } = {
    updatedByUserId: actor.id,
    updatedByUserName: actor.name,
  };
  if (params.contactId !== undefined) data.contactId = params.contactId;
  if (params.notes !== undefined) data.notes = params.notes;

  return db.employee.update({
    where: { id: params.id },
    data,
    select: employeeRowSelect,
  });
}
