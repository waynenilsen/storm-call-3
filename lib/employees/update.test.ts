import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createOrganization } from "@/lib/organizations/create";
import { makeEmployeeWithOrg } from "@/test/test-employee";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

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
      name: `Renamed ${slug}`,
      email: `renamed-${slug}@example.test`,
    });
    expect(updated.name).toBe(`Renamed ${slug}`);
    expect(updated.email).toBe(`renamed-${slug}@example.test`);
    expect(updated.updatedByUserId).toBe(editor.id);
    expect(updated.updatedByUserName).toBe(editor.name);
    expect(updated.createdByUserId).toBe(owner.id);
  });

  test("normalizes US phone on update", async () => {
    const { org, owner, employee } = await makeEmployeeWithOrg("emp-upd-phone");
    const updated = await updateEmployee({
      id: employee.id,
      organizationId: org.id,
      actingUserId: owner.id,
      phone: "(206) 555-0199",
    });
    expect(updated.phone).toBe("+12065550199");
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
        name: "Nope",
      }),
    ).rejects.toBeInstanceOf(EmployeeNotInOrganizationError);
  });
});
