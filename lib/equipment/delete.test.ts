import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { ACTIVITY_ACTION, RESOURCE_TYPE } from "@/lib/activity/schemas";
import { createOrganization } from "@/lib/organizations/create";
import { makeEquipmentWithOrg } from "@/test/test-equipment";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { deleteEquipment } from "./delete";

describe("deleteEquipment", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("removes the row when id and organization match and records an activity", async () => {
    const { owner, org, equipment } = await makeEquipmentWithOrg("eq-del-ok");
    await expect(
      deleteEquipment({
        id: equipment.id,
        organizationId: org.id,
        actingUserId: owner.id,
      }),
    ).resolves.toEqual({ ok: true });

    const row = await prisma.equipment.findUnique({
      where: { id: equipment.id },
    });
    expect(row).toBeNull();

    const activity = await prisma.activity.findFirstOrThrow({
      where: {
        organizationId: org.id,
        resourceId: equipment.id,
        action: ACTIVITY_ACTION.EQUIPMENT_DELETED,
      },
    });
    expect(activity.actorUserId).toBe(owner.id);
    expect(activity.resourceType).toBe(RESOURCE_TYPE.EQUIPMENT);
  });

  test("returns ok false and leaves the row when organization does not match", async () => {
    const { equipment } = await makeEquipmentWithOrg("eq-del-scope");
    const stranger = await makeUser("eq-del-stranger");
    const otherOrg = await createOrganization({
      name: `Other ${createId()}`,
      ownerUserId: stranger.id,
    });
    const result = await deleteEquipment({
      id: equipment.id,
      organizationId: otherOrg.id,
      actingUserId: stranger.id,
    });
    expect(result).toEqual({ ok: false });

    const row = await prisma.equipment.findUnique({
      where: { id: equipment.id },
    });
    expect(row).not.toBeNull();

    const stray = await prisma.activity.findFirst({
      where: {
        organizationId: otherOrg.id,
        resourceId: equipment.id,
        action: ACTIVITY_ACTION.EQUIPMENT_DELETED,
      },
    });
    expect(stray).toBeNull();
  });
});
