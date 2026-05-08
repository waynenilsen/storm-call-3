import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";
import { createOrganization } from "./create";
import { getMembership } from "./membership";
import { ORG_ROLE } from "./schemas";

describe("getMembership", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns OWNER for the creating user", async () => {
    const me = await makeUser("mem-owner");
    const org = await createOrganization({
      name: `Org ${createId()}`,
      ownerUserId: me.id,
    });
    const m = await getMembership({ userId: me.id, organizationId: org.id });
    expect(m?.role).toBe(ORG_ROLE.OWNER);
  });

  test("returns null for a non-member", async () => {
    const owner = await makeUser("mem-owner-2");
    const stranger = await makeUser("mem-stranger");
    const org = await createOrganization({
      name: `Org ${createId()}`,
      ownerUserId: owner.id,
    });
    const m = await getMembership({
      userId: stranger.id,
      organizationId: org.id,
    });
    expect(m).toBeNull();
  });
});
