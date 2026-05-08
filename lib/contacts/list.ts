import type { Prisma, PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { contactRowSelect } from "./row-select";
import type { ListContactsInput } from "./schemas";

export async function listContactsInOrganization(
  filters: ListContactsInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const search = filters.search?.trim();
  const or: Prisma.ContactWhereInput[] = [];
  if (search && search.length > 0) {
    or.push({ name: { contains: search, mode: "insensitive" } });
    or.push({ email: { contains: search, mode: "insensitive" } });
    // Phone is stored E.164 like +15551234567; match a digit-only needle so
    // a query of "(555) 123-4567" hits it. Sub-3-digit needles fall back to
    // seq scan via the trigram index, so we skip them.
    const digits = search.replace(/\D+/g, "");
    if (digits.length >= 3) {
      or.push({ phone: { contains: digits } });
    }
  }

  return db.contact.findMany({
    where: {
      organizationId: filters.organizationId,
      ...(or.length > 0 ? { OR: or } : {}),
    },
    select: contactRowSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: filters.limit,
    skip: filters.offset,
  });
}
