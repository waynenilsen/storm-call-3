import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { ACTIVITY_ACTION } from "@/lib/activity/schemas";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";
import { slugify } from "../slugify";
import { createOrganization } from "./create";
import { updateOrganization } from "./update";

describe("updateOrganization", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("renames an organization", async () => {
    const me = await makeUser("update-rename");
    const org = await createOrganization({
      name: `Before ${createId()}`,
      ownerUserId: me.id,
    });
    const token = createId();
    const newName = `After ${token}`;
    const renamed = await updateOrganization({
      id: org.id,
      name: newName,
      actingUserId: me.id,
    });
    expect(renamed.name).toBe(newName);
    expect(renamed.slug).toBe(slugify(newName));

    const stored = await prisma.organization.findUniqueOrThrow({
      where: { id: org.id },
      select: { name: true, slug: true },
    });
    expect(stored.name).toBe(newName);
    expect(stored.slug).toBe(slugify(newName));

    const activity = await prisma.activity.findFirstOrThrow({
      where: {
        organizationId: org.id,
        resourceId: org.id,
        action: ACTIVITY_ACTION.ORGANIZATION_UPDATED,
      },
    });
    expect(activity.actorUserId).toBe(me.id);
    expect(activity.metadata).toEqual({ changedFields: ["name"] });
  });

  test("picks non-colliding slug when the new name matches another org slug", async () => {
    const owner = await makeUser("upd-slug-collide");
    const suffix = createId().toLowerCase();
    await createOrganization({
      name: `Primary Brand! ${suffix}`,
      ownerUserId: owner.id,
    });
    const other = await createOrganization({
      name: `Beta Co ${suffix}`,
      ownerUserId: owner.id,
    });
    const refreshed = await updateOrganization({
      id: other.id,
      name: `primary brand??? ${suffix}`,
      actingUserId: owner.id,
    });
    const expectedBase = slugify(`Primary Brand! ${suffix}`);
    expect(refreshed.slug).toBe(`${expectedBase}-2`);
    expect(slugify(refreshed.name)).toBe(expectedBase);
  });

  test("updates url when provided", async () => {
    const me = await makeUser("update-url-set");
    const org = await createOrganization({
      name: `Org ${createId()}`,
      ownerUserId: me.id,
    });
    const updated = await updateOrganization({
      id: org.id,
      name: org.name,
      url: "https://acme.test",
      actingUserId: me.id,
    });
    expect(updated.url).toBe("https://acme.test");
    const stored = await prisma.organization.findUniqueOrThrow({
      where: { id: org.id },
      select: { url: true },
    });
    expect(stored.url).toBe("https://acme.test");
  });

  test("clears url when explicitly set to null", async () => {
    const me = await makeUser("update-url-clear");
    const org = await createOrganization({
      name: `Org ${createId()}`,
      url: "https://existing.test",
      ownerUserId: me.id,
    });
    const updated = await updateOrganization({
      id: org.id,
      name: org.name,
      url: null,
      actingUserId: me.id,
    });
    expect(updated.url).toBeNull();
  });

  test("leaves url untouched when key is omitted", async () => {
    const me = await makeUser("update-url-omit");
    const org = await createOrganization({
      name: `Before ${createId()}`,
      url: "https://keep.test",
      ownerUserId: me.id,
    });
    const updated = await updateOrganization({
      id: org.id,
      name: `After ${createId()}`,
      actingUserId: me.id,
    });
    expect(updated.url).toBe("https://keep.test");
  });
});
