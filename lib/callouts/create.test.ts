import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createOrganization } from "@/lib/organizations/create";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { createCallout } from "./create";

describe("createCallout", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("stores row under organization with audit fields from the acting user", async () => {
    const slug = createId();
    const owner = await makeUser(`co-create-owner-${slug}`);
    const org = await createOrganization({
      name: `Org For Callout ${slug}`,
      ownerUserId: owner.id,
    });
    const callout = await createCallout({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Blast ${slug}`,
      messageText: `Hello team ${slug}`,
    });

    expect(callout.organizationId).toBe(org.id);
    expect(callout.name).toBe(`Blast ${slug}`);
    expect(callout.messageText).toBe(`Hello team ${slug}`);
    expect(callout.createdByUserId).toBe(owner.id);
    expect(callout.updatedByUserId).toBe(owner.id);
    expect(callout.createdByUserName).toBe(owner.name);
    expect(callout.updatedByUserName).toBe(owner.name);

    const row = await prisma.callout.findUniqueOrThrow({
      where: { id: callout.id },
      select: { organizationId: true },
    });
    expect(row.organizationId).toBe(org.id);
  });
});
