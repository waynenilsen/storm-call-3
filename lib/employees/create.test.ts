import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createOrganization } from "@/lib/organizations/create";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { createEmployee } from "./create";
import { InvalidEmployeePhoneError } from "./phone-us";

describe("createEmployee", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("stores row under organization with audit fields from the acting user", async () => {
    const slug = createId();
    const owner = await makeUser(`emp-create-owner-${slug}`);
    const org = await createOrganization({
      name: `Org For Emp ${slug}`,
      ownerUserId: owner.id,
    });
    const employee = await createEmployee({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Pat Example ${slug}`,
      email: `pat-${slug}@example.test`,
      phone: "+12025551999",
    });

    expect(employee.organizationId).toBe(org.id);
    expect(employee.name).toBe(`Pat Example ${slug}`);
    expect(employee.email).toBe(`pat-${slug}@example.test`);
    expect(employee.phone).toBe("+12025551999");
    expect(employee.createdByUserId).toBe(owner.id);
    expect(employee.updatedByUserId).toBe(owner.id);
    expect(employee.createdByUserName).toBe(owner.name);
    expect(employee.updatedByUserName).toBe(owner.name);

    const row = await prisma.employee.findUniqueOrThrow({
      where: { id: employee.id },
      select: { organizationId: true },
    });
    expect(row.organizationId).toBe(org.id);
  });

  test("normalizes US-local formatted phone to E.164 on create", async () => {
    const slug = createId();
    const owner = await makeUser(`emp-phone-fmt-${slug}`);
    const org = await createOrganization({
      name: `Org Phone ${slug}`,
      ownerUserId: owner.id,
    });
    const employee = await createEmployee({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Phone User ${slug}`,
      phone: "(206) 555-0199",
    });
    expect(employee.phone).toBe("+12065550199");
  });

  test("rejects phone numbers libphonenumber cannot parse as valid US", async () => {
    const owner = await makeUser("emp-bad-phone");
    const org = await createOrganization({
      name: `Org Bad Phone ${createId()}`,
      ownerUserId: owner.id,
    });
    await expect(
      createEmployee({
        organizationId: org.id,
        actingUserId: owner.id,
        phone: "totally not a number",
      }),
    ).rejects.toBeInstanceOf(InvalidEmployeePhoneError);
  });

  test("allows a minimal row with only organization and actor", async () => {
    const owner = await makeUser("emp-minimal");
    const org = await createOrganization({
      name: `Bare Org ${createId()}`,
      ownerUserId: owner.id,
    });
    const employee = await createEmployee({
      organizationId: org.id,
      actingUserId: owner.id,
    });
    expect(employee.name).toBeNull();
    expect(employee.email).toBeNull();
    expect(employee.phone).toBeNull();
    expect(employee.id.length).toBeGreaterThan(0);
  });
});
