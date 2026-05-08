import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createOrganization } from "@/lib/organizations/create";
import { makeEquipmentWithOrg } from "@/test/test-equipment";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { getEquipmentInOrganization } from "./get";

describe("getEquipmentInOrganization", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns the equipment when id matches organization", async () => {
    const { org, equipment } = await makeEquipmentWithOrg("eq-get-hit");
    const result = await getEquipmentInOrganization({
      id: equipment.id,
      organizationId: org.id,
    });
    expect(result?.id).toBe(equipment.id);
    expect(result?.companyCode).toBe(equipment.companyCode);
  });

  test("returns null when the equipment belongs to another organization", async () => {
    const { equipment } = await makeEquipmentWithOrg("eq-get-wrong-org");
    const stranger = await makeUser("eq-get-stranger");
    const otherOrg = await createOrganization({
      name: `Other ${createId()}`,
      ownerUserId: stranger.id,
    });
    const result = await getEquipmentInOrganization({
      id: equipment.id,
      organizationId: otherOrg.id,
    });
    expect(result).toBeNull();
  });

  test("returns null for an unknown equipment id", async () => {
    const { org } = await makeEquipmentWithOrg("eq-get-missing");
    const result = await getEquipmentInOrganization({
      id: createId(),
      organizationId: org.id,
    });
    expect(result).toBeNull();
  });
});
