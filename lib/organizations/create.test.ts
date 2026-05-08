import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";
import { slugify } from "../slugify";
import { createOrganization } from "./create";
import { ORG_ROLE } from "./schemas";

describe("createOrganization", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("creates org and OWNER membership for the creator", async () => {
    const user = await makeUser("create-org");
    const token = createId();
    const org = await createOrganization({
      name: `Acme ${token}`,
      ownerUserId: user.id,
    });

    expect(org.id.length).toBeGreaterThan(0);
    expect(org.name).toBe(`Acme ${token}`);
    expect(org.slug).toBe(slugify(`Acme ${token}`));
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
    const token = createId().toLowerCase();
    const org = await createOrganization({
      name: `Padded Inc ${token}`,
      ownerUserId: user.id,
    });
    const stored = await prisma.organization.findUniqueOrThrow({
      where: { id: org.id },
      select: { name: true, slug: true },
    });
    expect(stored.name).toBe(`Padded Inc ${token}`);
    expect(stored.slug).toBe(slugify(`Padded Inc ${token}`));
  });

  test("creates org with url when provided", async () => {
    const user = await makeUser("create-org-url");
    const org = await createOrganization({
      name: `WithUrl ${createId()}`,
      url: "https://example.com",
      ownerUserId: user.id,
    });
    expect(org.url).toBe("https://example.com");
    const stored = await prisma.organization.findUniqueOrThrow({
      where: { id: org.id },
      select: { url: true },
    });
    expect(stored.url).toBe("https://example.com");
  });

  test("creates org with null url when omitted", async () => {
    const user = await makeUser("create-org-no-url");
    const org = await createOrganization({
      name: `NoUrl ${createId()}`,
      ownerUserId: user.id,
    });
    expect(org.url).toBeNull();
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

  test("allocates incremented slug when two names collide after slugify", async () => {
    const owner = await makeUser("slug-dup-owner");
    const suffix = createId().toLowerCase();
    const first = await createOrganization({
      name: `Twin Co! ${suffix}`,
      ownerUserId: owner.id,
    });
    const second = await createOrganization({
      name: `twin  co? ${suffix}`,
      ownerUserId: owner.id,
    });
    const baseSlug = slugify(`Twin Co! ${suffix}`);
    expect(first.slug).toBe(baseSlug);
    expect(second.slug).toBe(`${baseSlug}-2`);
    expect(first.id).not.toBe(second.id);
  });

  test("uses fallback base slug when name has no alphanumeric content", async () => {
    const owner = await makeUser("slug-emoji-owner");
    const alpha = await createOrganization({
      name: "⚡⚡⚡",
      ownerUserId: owner.id,
    });
    const beta = await createOrganization({
      name: "***",
      ownerUserId: owner.id,
    });
    expect(alpha.slug).toMatch(/^organization(-\d+)?$/);
    expect(beta.slug).toMatch(/^organization(-\d+)?$/);
    expect(alpha.slug).not.toBe(beta.slug);
  });
});
