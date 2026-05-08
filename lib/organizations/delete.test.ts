import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";
import { createOrganization } from "./create";
import { deleteOrganization } from "./delete";

describe("deleteOrganization", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("deletes the org and cascades to memberships", async () => {
    const me = await makeUser("delete-org");
    const org = await createOrganization({
      name: `Doomed ${createId()}`,
      ownerUserId: me.id,
    });

    await expect(deleteOrganization({ id: org.id })).resolves.toEqual({
      ok: true,
    });

    const remaining = await prisma.organization.findUnique({
      where: { id: org.id },
    });
    expect(remaining).toBeNull();

    const memberships = await prisma.userOrganization.findMany({
      where: { organizationId: org.id },
    });
    expect(memberships).toHaveLength(0);
  });
});
