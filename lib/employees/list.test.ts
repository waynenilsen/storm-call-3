import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

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

  test("filters by case-insensitive match on name or email", async () => {
    const slug = createId();
    const { org, owner } = await makeEmployeeWithOrg("emp-list-search");
    const target = await createEmployee({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Quarry Lead ${slug}`,
      email: `hidden-${slug}@inner.example.test`,
    });
    await createEmployee({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Noise Row ${slug}`,
      email: `noise-${slug}@example.test`,
    });

    const byName = await listEmployeesInOrganization(
      listEmployeesInputSchema.parse({
        organizationId: org.id,
        search: "quarry",
      }),
    );
    expect(byName.map((r) => r.id)).toEqual([target.id]);

    const byEmail = await listEmployeesInOrganization(
      listEmployeesInputSchema.parse({
        organizationId: org.id,
        search: "inner.example",
      }),
    );
    expect(byEmail.map((r) => r.id)).toEqual([target.id]);
  });

  test("respects limit and offset for pagination", async () => {
    const { org, owner } = await makeEmployeeWithOrg("emp-list-page");
    for (let i = 0; i < 3; i += 1) {
      await createEmployee({
        organizationId: org.id,
        actingUserId: owner.id,
        name: `Page Emp ${i} ${createId()}`,
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
