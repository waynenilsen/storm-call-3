import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createOrganization } from "@/lib/organizations/create";
import { makeContactWithOrg } from "@/test/test-contact";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { getContactInOrganization } from "./get";

describe("getContactInOrganization", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns the contact when id matches organization", async () => {
    const { org, contact } = await makeContactWithOrg("contact-get-hit");
    const result = await getContactInOrganization({
      id: contact.id,
      organizationId: org.id,
    });
    expect(result?.id).toBe(contact.id);
    expect(result?.email).toBe(contact.email);
  });

  test("returns null when the contact belongs to another organization", async () => {
    const { contact } = await makeContactWithOrg("contact-get-wrong-org");
    const stranger = await makeUser("contact-get-stranger");
    const otherOrg = await createOrganization({
      name: `Other ${createId()}`,
      ownerUserId: stranger.id,
    });
    const result = await getContactInOrganization({
      id: contact.id,
      organizationId: otherOrg.id,
    });
    expect(result).toBeNull();
  });

  test("returns null for an unknown contact id", async () => {
    const { org } = await makeContactWithOrg("contact-get-missing");
    const result = await getContactInOrganization({
      id: createId(),
      organizationId: org.id,
    });
    expect(result).toBeNull();
  });
});
