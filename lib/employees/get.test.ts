import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createOrganization } from "@/lib/organizations/create";
import { makeEmployeeWithOrg } from "@/test/test-employee";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { getEmployeeInOrganization } from "./get";

describe("getEmployeeInOrganization", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns the employee when id matches organization", async () => {
    const { org, employee, contact } = await makeEmployeeWithOrg("emp-get-hit");
    const result = await getEmployeeInOrganization({
      id: employee.id,
      organizationId: org.id,
    });
    expect(result?.id).toBe(employee.id);
    expect(result?.contactId).toBe(contact.id);
  });

  test("returns null when the employee belongs to another organization", async () => {
    const { employee } = await makeEmployeeWithOrg("emp-get-wrong-org");
    const stranger = await makeUser("emp-get-stranger");
    const otherOrg = await createOrganization({
      name: `Other ${createId()}`,
      ownerUserId: stranger.id,
    });
    const result = await getEmployeeInOrganization({
      id: employee.id,
      organizationId: otherOrg.id,
    });
    expect(result).toBeNull();
  });

  test("returns null for an unknown employee id", async () => {
    const { org } = await makeEmployeeWithOrg("emp-get-missing");
    const result = await getEmployeeInOrganization({
      id: createId(),
      organizationId: org.id,
    });
    expect(result).toBeNull();
  });
});
