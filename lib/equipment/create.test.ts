import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createOrganization } from "@/lib/organizations/create";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { createEquipment } from "./create";
import { MECHANICAL_STATUS, TOOL_STATUS } from "./schemas";

describe("createEquipment", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("stores row under organization with audit fields from the acting user", async () => {
    const slug = createId();
    const owner = await makeUser(`eq-create-owner-${slug}`);
    const org = await createOrganization({
      name: `Org For Equipment ${slug}`,
      ownerUserId: owner.id,
    });
    const equipment = await createEquipment({
      organizationId: org.id,
      actingUserId: owner.id,
      companyCode: `EQ-${slug}`,
      type: "vehicle",
      subtype: "excavator",
      mechanicalStatus: MECHANICAL_STATUS.OPERATIONAL,
      toolStatus: TOOL_STATUS.TOOLED,
      notes: `notes ${slug}`,
    });

    expect(equipment.organizationId).toBe(org.id);
    expect(equipment.companyCode).toBe(`EQ-${slug}`);
    expect(equipment.type).toBe("vehicle");
    expect(equipment.subtype).toBe("excavator");
    expect(equipment.mechanicalStatus).toBe(MECHANICAL_STATUS.OPERATIONAL);
    expect(equipment.toolStatus).toBe(TOOL_STATUS.TOOLED);
    expect(equipment.notes).toBe(`notes ${slug}`);
    expect(equipment.createdByUserId).toBe(owner.id);
    expect(equipment.updatedByUserId).toBe(owner.id);
    expect(equipment.createdByUserName).toBe(owner.name);
    expect(equipment.updatedByUserName).toBe(owner.name);

    const row = await prisma.equipment.findUniqueOrThrow({
      where: { id: equipment.id },
      select: { organizationId: true },
    });
    expect(row.organizationId).toBe(org.id);
  });

  test("allows omitting all optional fields", async () => {
    const slug = createId();
    const owner = await makeUser(`eq-create-bare-${slug}`);
    const org = await createOrganization({
      name: `Org Bare Equipment ${slug}`,
      ownerUserId: owner.id,
    });
    const equipment = await createEquipment({
      organizationId: org.id,
      actingUserId: owner.id,
    });
    expect(equipment.companyCode).toBeNull();
    expect(equipment.type).toBeNull();
    expect(equipment.subtype).toBeNull();
    expect(equipment.mechanicalStatus).toBeNull();
    expect(equipment.toolStatus).toBeNull();
    expect(equipment.notes).toBeNull();
  });
});
