import { createContact } from "@/lib/contacts/create";
import { prisma } from "@/lib/prisma";

export type SeedContactFixture = {
  key: string;
  name: string;
  email: string;
  phone: string;
};

export const CONTACT_FIXTURES: readonly SeedContactFixture[] = [
  {
    key: "alice",
    name: "Alice Johnson",
    email: "alice@example.com",
    phone: "+12025550101",
  },
  {
    key: "bob",
    name: "Bob Martinez",
    email: "bob@example.com",
    phone: "+12025550102",
  },
  {
    key: "carol",
    name: "Carol Nguyen",
    email: "carol@example.com",
    phone: "+12025550103",
  },
  {
    key: "dave",
    name: "Dave Patel",
    email: "dave@example.com",
    phone: "+12025550104",
  },
  {
    key: "eve",
    name: "Eve Robinson",
    email: "eve@example.com",
    phone: "+12025550105",
  },
] as const;

export type SeededContact = SeedContactFixture & { id: string };

/**
 * Creates one contact per fixture under the org. Idempotent at the (org, name)
 * level — already-present fixtures are looked up rather than re-created so the
 * paired empty conversation isn't duplicated.
 */
export async function seedContacts(
  organizationId: string,
  actingUserId: string,
): Promise<SeededContact[]> {
  const seeded: SeededContact[] = [];
  for (const fixture of CONTACT_FIXTURES) {
    const existing = await prisma.contact.findFirst({
      where: { organizationId, name: fixture.name },
      select: { id: true },
    });
    if (existing) {
      seeded.push({ ...fixture, id: existing.id });
      continue;
    }
    const created = await createContact({
      organizationId,
      actingUserId,
      name: fixture.name,
      email: fixture.email,
      phone: fixture.phone,
    });
    seeded.push({ ...fixture, id: created.id });
  }
  return seeded;
}
