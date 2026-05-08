import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createOrganization } from "@/lib/organizations/create";
import { makeEmployeeWithOrg } from "@/test/test-employee";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { deleteEmployee } from "./delete";

describe("deleteEmployee", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("removes the row when id and organization match", async () => {
    const { org, employee } = await makeEmployeeWithOrg("emp-del-ok");
    await expect(
      deleteEmployee({ id: employee.id, organizationId: org.id }),
    ).resolves.toEqual({ ok: true });

    const row = await prisma.employee.findUnique({
      where: { id: employee.id },
    });
    expect(row).toBeNull();
  });

  test("returns ok false and leaves the row when organization does not match", async () => {
    const { employee } = await makeEmployeeWithOrg("emp-del-scope");
    const stranger = await makeUser("emp-del-stranger");
    const otherOrg = await createOrganization({
      name: `Other ${createId()}`,
      ownerUserId: stranger.id,
    });
    const result = await deleteEmployee({
      id: employee.id,
      organizationId: otherOrg.id,
    });
    expect(result).toEqual({ ok: false });

    const row = await prisma.employee.findUnique({
      where: { id: employee.id },
    });
    expect(row).not.toBeNull();
  });
});
