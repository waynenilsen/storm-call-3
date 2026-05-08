import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";
import { createOrganization } from "./create";
import { ORG_ROLE } from "./schemas";

describe("createOrganization", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("creates org and OWNER membership for the creator", async () => {
    const user = await makeUser("create-org");
    const slug = createId();
    const org = await createOrganization({
      name: `Acme ${slug}`,
      ownerUserId: user.id,
    });

    expect(org.id.length).toBeGreaterThan(0);
    expect(org.name).toBe(`Acme ${slug}`);
    expect(org.role).toBe(ORG_ROLE.OWNER);

    const membership = await prisma.userOrganization.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: org.id,
        },
      },
      select: { role: true },
    });
    expect(membership.role).toBe(ORG_ROLE.OWNER);
  });

  test("trims and stores org name as provided after schema parse", async () => {
    const user = await makeUser("trim-org");
    const org = await createOrganization({
      name: "Padded Inc",
      ownerUserId: user.id,
    });
    const stored = await prisma.organization.findUniqueOrThrow({
      where: { id: org.id },
      select: { name: true },
    });
    expect(stored.name).toBe("Padded Inc");
  });

  test("two users may each own their own organization independently", async () => {
    const a = await makeUser("solo-a");
    const b = await makeUser("solo-b");
    const orgA = await createOrganization({
      name: `A ${createId()}`,
      ownerUserId: a.id,
    });
    const orgB = await createOrganization({
      name: `B ${createId()}`,
      ownerUserId: b.id,
    });
    expect(orgA.id).not.toBe(orgB.id);

    const aHasB = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: { userId: a.id, organizationId: orgB.id },
      },
    });
    expect(aHasB).toBeNull();
  });
});
