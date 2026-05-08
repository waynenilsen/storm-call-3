import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { ACTIVITY_ACTION, RESOURCE_TYPE } from "@/lib/activity/schemas";
import { createOrganization } from "@/lib/organizations/create";
import { makeContactWithOrg } from "@/test/test-contact";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { deleteContact } from "./delete";

describe("deleteContact", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("removes the row when id and organization match and records an activity", async () => {
    const { owner, org, contact } = await makeContactWithOrg("contact-del-ok");
    await expect(
      deleteContact({
        id: contact.id,
        organizationId: org.id,
        actingUserId: owner.id,
      }),
    ).resolves.toEqual({ ok: true });

    const row = await prisma.contact.findUnique({
      where: { id: contact.id },
    });
    expect(row).toBeNull();

    const activity = await prisma.activity.findFirstOrThrow({
      where: {
        organizationId: org.id,
        resourceId: contact.id,
        action: ACTIVITY_ACTION.CONTACT_DELETED,
      },
    });
    expect(activity.actorUserId).toBe(owner.id);
    expect(activity.resourceType).toBe(RESOURCE_TYPE.CONTACT);
  });

  test("returns ok false and leaves the row when organization does not match", async () => {
    const { contact } = await makeContactWithOrg("contact-del-scope");
    const stranger = await makeUser("contact-del-stranger");
    const otherOrg = await createOrganization({
      name: `Other ${createId()}`,
      ownerUserId: stranger.id,
    });
    const result = await deleteContact({
      id: contact.id,
      organizationId: otherOrg.id,
      actingUserId: stranger.id,
    });
    expect(result).toEqual({ ok: false });

    const row = await prisma.contact.findUnique({
      where: { id: contact.id },
    });
    expect(row).not.toBeNull();

    const stray = await prisma.activity.findFirst({
      where: {
        organizationId: otherOrg.id,
        resourceId: contact.id,
        action: ACTIVITY_ACTION.CONTACT_DELETED,
      },
    });
    expect(stray).toBeNull();
  });
});
