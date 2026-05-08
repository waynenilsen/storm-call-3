import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { ACTIVITY_ACTION } from "@/lib/activity/schemas";
import { createOrganization } from "@/lib/organizations/create";
import { makeEquipmentWithOrg } from "@/test/test-equipment";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { MECHANICAL_STATUS, TOOL_STATUS } from "./schemas";
import { EquipmentNotInOrganizationError, updateEquipment } from "./update";

describe("updateEquipment", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("updates fields and refreshes updated-by audit metadata", async () => {
    const { org, owner, equipment } = await makeEquipmentWithOrg("eq-upd");
    const editor = await makeUser("eq-upd-editor");
    const slug = createId();
    const updated = await updateEquipment({
      id: equipment.id,
      organizationId: org.id,
      actingUserId: editor.id,
      companyCode: `RENAMED-${slug}`,
      mechanicalStatus: MECHANICAL_STATUS.ISSUES,
      toolStatus: TOOL_STATUS.PARTIALLY_TOOLED,
      notes: `updated note ${slug}`,
    });
    expect(updated.companyCode).toBe(`RENAMED-${slug}`);
    expect(updated.mechanicalStatus).toBe(MECHANICAL_STATUS.ISSUES);
    expect(updated.toolStatus).toBe(TOOL_STATUS.PARTIALLY_TOOLED);
    expect(updated.notes).toBe(`updated note ${slug}`);
    expect(updated.updatedByUserId).toBe(editor.id);
    expect(updated.updatedByUserName).toBe(editor.name);
    expect(updated.createdByUserId).toBe(owner.id);

    const activity = await prisma.activity.findFirstOrThrow({
      where: {
        organizationId: org.id,
        resourceId: equipment.id,
        action: ACTIVITY_ACTION.EQUIPMENT_UPDATED,
      },
    });
    expect(activity.actorUserId).toBe(editor.id);
    expect(activity.metadata).toEqual({
      changedFields: ["companyCode", "mechanicalStatus", "toolStatus", "notes"],
    });
  });

  test("supports partial updates that only touch one field", async () => {
    const { org, owner, equipment } =
      await makeEquipmentWithOrg("eq-upd-partial");
    const slug = createId();
    const updated = await updateEquipment({
      id: equipment.id,
      organizationId: org.id,
      actingUserId: owner.id,
      notes: `notes only ${slug}`,
    });
    expect(updated.companyCode).toBe(equipment.companyCode);
    expect(updated.type).toBe(equipment.type);
    expect(updated.notes).toBe(`notes only ${slug}`);
  });

  test("supports clearing fields via null", async () => {
    const { org, owner, equipment } = await makeEquipmentWithOrg(
      "eq-upd-clear",
      {
        mechanicalStatus: MECHANICAL_STATUS.OPERATIONAL,
        toolStatus: TOOL_STATUS.TOOLED,
      },
    );
    const updated = await updateEquipment({
      id: equipment.id,
      organizationId: org.id,
      actingUserId: owner.id,
      mechanicalStatus: null,
      toolStatus: null,
    });
    expect(updated.mechanicalStatus).toBeNull();
    expect(updated.toolStatus).toBeNull();
  });

  test("throws when the equipment is not in the organization", async () => {
    const { equipment } = await makeEquipmentWithOrg("eq-upd-bad-org");
    const stranger = await makeUser("eq-upd-stranger");
    const otherOrg = await createOrganization({
      name: `Elsewhere ${createId()}`,
      ownerUserId: stranger.id,
    });
    await expect(
      updateEquipment({
        id: equipment.id,
        organizationId: otherOrg.id,
        actingUserId: stranger.id,
        notes: "Nope",
      }),
    ).rejects.toBeInstanceOf(EquipmentNotInOrganizationError);
  });
});
