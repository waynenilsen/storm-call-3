import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { ACTIVITY_ACTION, RESOURCE_TYPE } from "@/lib/activity/schemas";
import { createOrganization } from "@/lib/organizations/create";
import { makeCalloutWithOrg } from "@/test/test-callout";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { deleteCallout } from "./delete";

describe("deleteCallout", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("removes the row when id and organization match and records an activity", async () => {
    const { owner, org, callout } = await makeCalloutWithOrg("co-del-ok");
    await expect(
      deleteCallout({
        id: callout.id,
        organizationId: org.id,
        actingUserId: owner.id,
      }),
    ).resolves.toEqual({ ok: true });

    const row = await prisma.callout.findUnique({
      where: { id: callout.id },
    });
    expect(row).toBeNull();

    const activity = await prisma.activity.findFirstOrThrow({
      where: {
        organizationId: org.id,
        resourceId: callout.id,
        action: ACTIVITY_ACTION.CALLOUT_DELETED,
      },
    });
    expect(activity.actorUserId).toBe(owner.id);
    expect(activity.resourceType).toBe(RESOURCE_TYPE.CALLOUT);
  });

  test("returns ok false and leaves the row when organization does not match", async () => {
    const { callout } = await makeCalloutWithOrg("co-del-scope");
    const stranger = await makeUser("co-del-stranger");
    const otherOrg = await createOrganization({
      name: `Other ${createId()}`,
      ownerUserId: stranger.id,
    });
    const result = await deleteCallout({
      id: callout.id,
      organizationId: otherOrg.id,
      actingUserId: stranger.id,
    });
    expect(result).toEqual({ ok: false });

    const row = await prisma.callout.findUnique({
      where: { id: callout.id },
    });
    expect(row).not.toBeNull();
  });
});
