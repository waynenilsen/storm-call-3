import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createContact } from "@/lib/contacts/create";
import { createOrganization } from "@/lib/organizations/create";
import { makeEmployeeWithOrg } from "@/test/test-employee";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { ContactNotInOrganizationError } from "./create";
import { EmployeeNotInOrganizationError, updateEmployee } from "./update";

describe("updateEmployee", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("updates fields and refreshes updated-by audit metadata", async () => {
    const { org, owner, employee } = await makeEmployeeWithOrg("emp-upd");
    const editor = await makeUser("emp-upd-editor");
    const slug = createId();
    const updated = await updateEmployee({
      id: employee.id,
      organizationId: org.id,
      actingUserId: editor.id,
      notes: `updated note ${slug}`,
    });
    expect(updated.notes).toBe(`updated note ${slug}`);
    expect(updated.updatedByUserId).toBe(editor.id);
    expect(updated.updatedByUserName).toBe(editor.name);
    expect(updated.createdByUserId).toBe(owner.id);
  });

  test("supports replacing the contact within the same organization", async () => {
    const { org, owner, employee } = await makeEmployeeWithOrg("emp-upd-swap");
    const newContact = await createContact({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Replacement ${createId()}`,
    });
    const updated = await updateEmployee({
      id: employee.id,
      organizationId: org.id,
      actingUserId: owner.id,
      contactId: newContact.id,
    });
    expect(updated.contactId).toBe(newContact.id);
  });

  test("supports clearing notes via null", async () => {
    const { org, owner, employee } = await makeEmployeeWithOrg(
      "emp-upd-clear",
      { notes: "starting note" },
    );
    const updated = await updateEmployee({
      id: employee.id,
      organizationId: org.id,
      actingUserId: owner.id,
      notes: null,
    });
    expect(updated.notes).toBeNull();
  });

  test("throws when the employee is not in the organization", async () => {
    const { employee } = await makeEmployeeWithOrg("emp-upd-bad-org");
    const stranger = await makeUser("emp-upd-stranger");
    const otherOrg = await createOrganization({
      name: `Elsewhere ${createId()}`,
      ownerUserId: stranger.id,
    });
    await expect(
      updateEmployee({
        id: employee.id,
        organizationId: otherOrg.id,
        actingUserId: stranger.id,
        notes: "Nope",
      }),
    ).rejects.toBeInstanceOf(EmployeeNotInOrganizationError);
  });

  test("throws when contactId belongs to another organization", async () => {
    const { org, owner, employee } = await makeEmployeeWithOrg("emp-upd-xorg");
    const stranger = await makeUser("emp-upd-xorg-stranger");
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
      updateEmployee({
        id: employee.id,
        organizationId: org.id,
        actingUserId: owner.id,
        contactId: otherContact.id,
      }),
    ).rejects.toBeInstanceOf(ContactNotInOrganizationError);
  });
});
