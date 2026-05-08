import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";
import { createOrganization } from "./create";
import { getOrganizationForUser } from "./get";
import { ORG_ROLE } from "./schemas";

describe("getOrganizationForUser", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns org with role for a member", async () => {
    const me = await makeUser("get-member");
    const org = await createOrganization({
      name: `Mine ${createId()}`,
      ownerUserId: me.id,
    });
    const result = await getOrganizationForUser({
      organizationId: org.id,
      userId: me.id,
    });
    expect(result?.id).toBe(org.id);
    expect(result?.role).toBe(ORG_ROLE.OWNER);
  });

  test("returns null for a non-member even if the org exists", async () => {
    const owner = await makeUser("get-owner");
    const stranger = await makeUser("get-stranger");
    const org = await createOrganization({
      name: `Theirs ${createId()}`,
      ownerUserId: owner.id,
    });
    const result = await getOrganizationForUser({
      organizationId: org.id,
      userId: stranger.id,
    });
    expect(result).toBeNull();
  });

  test("returns null for an unknown org id", async () => {
    const me = await makeUser("get-ghost");
    const result = await getOrganizationForUser({
      organizationId: createId(),
      userId: me.id,
    });
    expect(result).toBeNull();
  });
});
