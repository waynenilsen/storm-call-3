import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";
import { expectTrpcErrorFrom } from "@/test/expect-trpc-error";
import { makeOrganizationWithOwner } from "@/test/test-org";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";
import { requireOwner } from "./authorization";

describe("requireOwner", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("does not throw when the user is the organization owner", async () => {
    const { owner, org } = await makeOrganizationWithOwner("auth-pass");
    await expect(requireOwner(owner.id, org.id)).resolves.toBeUndefined();
  });

  test("throws NOT_FOUND when the user has no membership", async () => {
    const { org } = await makeOrganizationWithOwner("auth-none");
    const stranger = await makeUser("auth-stranger");

    await expectTrpcErrorFrom(
      () => requireOwner(stranger.id, org.id),
      "NOT_FOUND",
      "Organization not found",
    );
  });

  test("throws FORBIDDEN when the user is a non-owner member", async () => {
    const { org } = await makeOrganizationWithOwner("auth-member-org");
    const member = await makeUser("auth-member-user");
    await prisma.userOrganization.create({
      data: {
        id: createId(),
        userId: member.id,
        organizationId: org.id,
        role: "MEMBER",
      },
    });

    await expectTrpcErrorFrom(
      () => requireOwner(member.id, org.id),
      "FORBIDDEN",
      "Only owners can perform this action",
    );
  });

  test("throws NOT_FOUND for an unknown organization id", async () => {
    const user = await makeUser("auth-bad-org");
    await expectTrpcErrorFrom(
      () => requireOwner(user.id, createId()),
      "NOT_FOUND",
    );
  });
});
