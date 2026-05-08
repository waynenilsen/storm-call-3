import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createOrganization } from "@/lib/organizations/create";
import { makeContactWithOrg } from "@/test/test-contact";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import {
  ContactNotInOrganizationForConversationError,
  createConversation,
} from "./create";

describe("createConversation", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("rejects when (org, contact) already has a conversation", async () => {
    // makeContactWithOrg creates a contact, which auto-creates the canonical
    // conversation. A second call must hit the @@unique constraint.
    const { org, contact } = await makeContactWithOrg("conv-dup");
    await expect(
      createConversation({
        organizationId: org.id,
        contactId: contact.id,
      }),
    ).rejects.toThrow();
  });

  test("rejects when contact is not in the organization", async () => {
    const { contact } = await makeContactWithOrg("conv-bad-org");
    const stranger = await makeUser("conv-stranger");
    const otherOrg = await createOrganization({
      name: `Elsewhere ${createId()}`,
      ownerUserId: stranger.id,
    });
    await expect(
      createConversation({
        organizationId: otherOrg.id,
        contactId: contact.id,
      }),
    ).rejects.toBeInstanceOf(ContactNotInOrganizationForConversationError);
  });
});
