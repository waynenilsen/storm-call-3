import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

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
    });
    expect(renamed.name).toBe(newName);
    expect(renamed.slug).toBe(slugify(newName));

    const stored = await prisma.organization.findUniqueOrThrow({
      where: { id: org.id },
      select: { name: true, slug: true },
    });
    expect(stored.name).toBe(newName);
    expect(stored.slug).toBe(slugify(newName));
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
    });
    const expectedBase = slugify(`Primary Brand! ${suffix}`);
    expect(refreshed.slug).toBe(`${expectedBase}-2`);
    expect(slugify(refreshed.name)).toBe(expectedBase);
  });
});
