import { afterAll, describe, expect, test } from "bun:test";

import { createContact } from "@/lib/contacts/create";
import { makeOrganizationWithOwner } from "@/test/test-org";

import { prisma } from "../prisma";

import { listConversationsInOrganization } from "./list";

describe("listConversationsInOrganization", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns one conversation per contact in the org and respects pagination", async () => {
    const { owner, org } = await makeOrganizationWithOwner("conv-list");
    for (let i = 0; i < 3; i++) {
      await createContact({
        organizationId: org.id,
        actingUserId: owner.id,
        name: `Contact ${i}`,
      });
    }

    const all = await listConversationsInOrganization({
      organizationId: org.id,
      limit: 50,
      offset: 0,
    });
    expect(all.length).toBe(3);
    for (const c of all) expect(c.organizationId).toBe(org.id);

    const firstPage = await listConversationsInOrganization({
      organizationId: org.id,
      limit: 2,
      offset: 0,
    });
    const secondPage = await listConversationsInOrganization({
      organizationId: org.id,
      limit: 2,
      offset: 2,
    });
    expect(firstPage.length).toBe(2);
    expect(secondPage.length).toBe(1);
  });

  test("filters by contactId when provided", async () => {
    const { owner, org } = await makeOrganizationWithOwner("conv-list-filter");
    const a = await createContact({
      organizationId: org.id,
      actingUserId: owner.id,
      name: "A",
    });
    await createContact({
      organizationId: org.id,
      actingUserId: owner.id,
      name: "B",
    });

    const filtered = await listConversationsInOrganization({
      organizationId: org.id,
      contactId: a.id,
      limit: 50,
      offset: 0,
    });
    expect(filtered.length).toBe(1);
    expect(filtered[0]?.contactId).toBe(a.id);
  });
});
