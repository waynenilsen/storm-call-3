import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createOrganization } from "@/lib/organizations/create";
import { makeContactWithOrg } from "@/test/test-contact";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import {
  getConversationByContactId,
  getConversationInOrganization,
} from "./get";

describe("getConversation", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns the conversation auto-created with its contact", async () => {
    const { org, contact } = await makeContactWithOrg("conv-get");
    const found = await getConversationByContactId({
      contactId: contact.id,
      organizationId: org.id,
    });
    expect(found).not.toBeNull();
    expect(found?.contactId).toBe(contact.id);
    expect(found?.organizationId).toBe(org.id);
    expect(found?.messageCount).toBe(0);
    expect(found?.unreadCount).toBe(0);
    expect(found?.lastMessageAt).toBeNull();
    if (!found) throw new Error("expected conversation");

    const byId = await getConversationInOrganization({
      id: found.id,
      organizationId: org.id,
    });
    expect(byId?.id).toBe(found.id);
  });

  test("scopes lookup to the organization", async () => {
    const { contact } = await makeContactWithOrg("conv-scope");
    const stranger = await makeUser("conv-scope-stranger");
    const otherOrg = await createOrganization({
      name: `Elsewhere ${createId()}`,
      ownerUserId: stranger.id,
    });
    const found = await getConversationByContactId({
      contactId: contact.id,
      organizationId: otherOrg.id,
    });
    expect(found).toBeNull();
  });
});
