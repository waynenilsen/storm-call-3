import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeOrganizationWithOwner } from "@/test/test-org";

import { prisma } from "../prisma";

import { recordActivity } from "./record";
import { ACTIVITY_ACTION, RESOURCE_TYPE } from "./schemas";

describe("recordActivity", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("writes activity row inside the supplied transaction", async () => {
    const { owner, org } = await makeOrganizationWithOwner("act-record");
    const fakeResourceId = createId();

    await prisma.$transaction(async (tx) => {
      await recordActivity(
        {
          organizationId: org.id,
          actorUserId: owner.id,
          action: ACTIVITY_ACTION.CONTACT_CREATED,
          resourceType: RESOURCE_TYPE.CONTACT,
          resourceId: fakeResourceId,
          resourceLabel: "Sample Contact",
          metadata: { foo: "bar" },
        },
        tx,
      );
    });

    const rows = await prisma.activity.findMany({
      where: { organizationId: org.id, resourceId: fakeResourceId },
    });
    expect(rows).toHaveLength(1);
    const row = rows[0];
    if (!row) throw new Error("expected row");
    expect(row.action).toBe(ACTIVITY_ACTION.CONTACT_CREATED);
    expect(row.resourceType).toBe(RESOURCE_TYPE.CONTACT);
    expect(row.resourceLabel).toBe("Sample Contact");
    expect(row.actorUserId).toBe(owner.id);
    expect(row.actorUserName).toBe(owner.name);
    expect(row.metadata).toEqual({ foo: "bar" });
  });

  test("rolls back the activity if the surrounding transaction throws", async () => {
    const { owner, org } = await makeOrganizationWithOwner("act-rollback");
    const fakeResourceId = createId();

    await expect(
      prisma.$transaction(async (tx) => {
        await recordActivity(
          {
            organizationId: org.id,
            actorUserId: owner.id,
            action: ACTIVITY_ACTION.CONTACT_CREATED,
            resourceType: RESOURCE_TYPE.CONTACT,
            resourceId: fakeResourceId,
          },
          tx,
        );
        throw new Error("force rollback");
      }),
    ).rejects.toThrow("force rollback");

    const rows = await prisma.activity.findMany({
      where: { organizationId: org.id, resourceId: fakeResourceId },
    });
    expect(rows).toHaveLength(0);
  });

  test("supports null actor for system-generated entries", async () => {
    const { org } = await makeOrganizationWithOwner("act-system");
    const fakeResourceId = createId();

    await prisma.$transaction(async (tx) => {
      await recordActivity(
        {
          organizationId: org.id,
          actorUserId: null,
          action: ACTIVITY_ACTION.CONVERSATION_CREATED,
          resourceType: RESOURCE_TYPE.CONVERSATION,
          resourceId: fakeResourceId,
        },
        tx,
      );
    });

    const row = await prisma.activity.findFirstOrThrow({
      where: { organizationId: org.id, resourceId: fakeResourceId },
    });
    expect(row.actorUserId).toBeNull();
    expect(row.actorUserName).toBeNull();
  });
});
