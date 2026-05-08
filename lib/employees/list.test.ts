import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createContact } from "@/lib/contacts/create";
import { makeEmployeeWithOrg } from "@/test/test-employee";

import { prisma } from "../prisma";

import { createEmployee } from "./create";
import { listEmployeesInOrganization } from "./list";
import { listEmployeesInputSchema } from "./schemas";

describe("listEmployeesInOrganization", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns only employees for the requested organization", async () => {
    const { org, employee } = await makeEmployeeWithOrg("emp-list-mine");
    const { org: otherOrg, employee: otherEmployee } =
      await makeEmployeeWithOrg("emp-list-theirs");

    const rows = await listEmployeesInOrganization(
      listEmployeesInputSchema.parse({ organizationId: org.id }),
    );
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(employee.id);
    expect(ids).not.toContain(otherEmployee.id);
    expect(otherOrg.id).not.toBe(org.id);
  });

  test("filters by case-insensitive search across notes and contact name/email", async () => {
    const slug = createId();
    const { org, owner } = await makeEmployeeWithOrg("emp-list-search");

    const namedContact = await createContact({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `QUARRY-NAMED-${slug}`,
    });
    const nameMatch = await createEmployee({
      organizationId: org.id,
      actingUserId: owner.id,
      contactId: namedContact.id,
    });

    const otherContact = await createContact({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Other ${slug}`,
    });
    const notesMatch = await createEmployee({
      organizationId: org.id,
      actingUserId: owner.id,
      contactId: otherContact.id,
      notes: `pickaxe-${slug} inside`,
    });

    const noiseContact = await createContact({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Plain ${slug}`,
    });
    await createEmployee({
      organizationId: org.id,
      actingUserId: owner.id,
      contactId: noiseContact.id,
      notes: `nothing here ${slug}`,
    });

    const byName = await listEmployeesInOrganization(
      listEmployeesInputSchema.parse({
        organizationId: org.id,
        search: `quarry-named-${slug}`,
      }),
    );
    expect(byName.map((r) => r.id)).toEqual([nameMatch.id]);

    const byNotes = await listEmployeesInOrganization(
      listEmployeesInputSchema.parse({
        organizationId: org.id,
        search: `pickaxe-${slug}`,
      }),
    );
    expect(byNotes.map((r) => r.id)).toEqual([notesMatch.id]);
  });

  test("filters by contactId", async () => {
    const { org, owner, contact, employee } =
      await makeEmployeeWithOrg("emp-list-bycontact");
    const otherContact = await createContact({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Other ${createId()}`,
    });
    const otherEmployee = await createEmployee({
      organizationId: org.id,
      actingUserId: owner.id,
      contactId: otherContact.id,
    });

    const rows = await listEmployeesInOrganization(
      listEmployeesInputSchema.parse({
        organizationId: org.id,
        contactId: contact.id,
      }),
    );
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(employee.id);
    expect(ids).not.toContain(otherEmployee.id);
  });

  test("respects limit and offset for pagination", async () => {
    const { org, owner } = await makeEmployeeWithOrg("emp-list-page");
    for (let i = 0; i < 3; i += 1) {
      const c = await createContact({
        organizationId: org.id,
        actingUserId: owner.id,
        name: `Page ${i} ${createId()}`,
      });
      await createEmployee({
        organizationId: org.id,
        actingUserId: owner.id,
        contactId: c.id,
      });
    }

    const firstTwo = await listEmployeesInOrganization(
      listEmployeesInputSchema.parse({
        organizationId: org.id,
        limit: 2,
        offset: 0,
      }),
    );
    expect(firstTwo).toHaveLength(2);
    const next = await listEmployeesInOrganization(
      listEmployeesInputSchema.parse({
        organizationId: org.id,
        limit: 2,
        offset: 2,
      }),
    );
    expect(next.length).toBeGreaterThanOrEqual(1);
  });
});
