import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createContact } from "@/lib/contacts/create";
import { createOrganization } from "@/lib/organizations/create";
import { makeOrganizationWithOwner } from "@/test/test-org";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { ContactNotInOrganizationError, createEmployee } from "./create";

describe("createEmployee", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("stores row under organization with audit fields from the acting user", async () => {
    const slug = createId();
    const { owner, org } = await makeOrganizationWithOwner(
      `emp-create-${slug}`,
    );
    const contact = await createContact({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Person ${slug}`,
      email: `person-${slug}@example.test`,
    });

    const employee = await createEmployee({
      organizationId: org.id,
      actingUserId: owner.id,
      contactId: contact.id,
      notes: `notes ${slug}`,
    });

    expect(employee.organizationId).toBe(org.id);
    expect(employee.contactId).toBe(contact.id);
    expect(employee.notes).toBe(`notes ${slug}`);
    expect(employee.createdByUserId).toBe(owner.id);
    expect(employee.updatedByUserId).toBe(owner.id);
    expect(employee.createdByUserName).toBe(owner.name);
    expect(employee.updatedByUserName).toBe(owner.name);

    const row = await prisma.employee.findUniqueOrThrow({
      where: { id: employee.id },
      select: { organizationId: true, contactId: true },
    });
    expect(row.organizationId).toBe(org.id);
    expect(row.contactId).toBe(contact.id);
  });

  test("allows omitting notes", async () => {
    const slug = createId();
    const { owner, org } = await makeOrganizationWithOwner(`emp-bare-${slug}`);
    const contact = await createContact({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Person ${slug}`,
    });
    const employee = await createEmployee({
      organizationId: org.id,
      actingUserId: owner.id,
      contactId: contact.id,
    });
    expect(employee.notes).toBeNull();
  });

  test("rejects a contact from a different organization", async () => {
    const { owner, org } = await makeOrganizationWithOwner("emp-create-xorg");
    const stranger = await makeUser("emp-create-stranger");
    const otherOrg = await createOrganization({
      name: `Other ${createId()}`,
      ownerUserId: stranger.id,
    });
    const otherContact = await createContact({
      organizationId: otherOrg.id,
      actingUserId: stranger.id,
      name: `Outsider ${createId()}`,
    });

    await expect(
      createEmployee({
        organizationId: org.id,
        actingUserId: owner.id,
        contactId: otherContact.id,
      }),
    ).rejects.toBeInstanceOf(ContactNotInOrganizationError);
  });
});
