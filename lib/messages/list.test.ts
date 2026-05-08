import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createOrganization } from "@/lib/organizations/create";
import { makeConversationWithContact } from "@/test/test-conversation";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { createMessage } from "./create";
import { getMessageInOrganization } from "./get";
import { listMessagesInConversation } from "./list";
import { MESSAGE_DIRECTION } from "./schemas";

describe("listMessagesInConversation", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns most recent first and respects pagination", async () => {
    const { org, owner, conversation } =
      await makeConversationWithContact("msg-list");
    const ordered: string[] = [];
    for (let i = 0; i < 4; i++) {
      const m = await createMessage({
        organizationId: org.id,
        conversationId: conversation.id,
        direction: MESSAGE_DIRECTION.OUTBOUND,
        content: `m${i}`,
        actingUserId: owner.id,
      });
      ordered.push(m.id);
    }

    const all = await listMessagesInConversation({
      organizationId: org.id,
      conversationId: conversation.id,
      limit: 50,
      offset: 0,
    });
    expect(all.map((m) => m.id)).toEqual([...ordered].reverse());

    const firstPage = await listMessagesInConversation({
      organizationId: org.id,
      conversationId: conversation.id,
      limit: 2,
      offset: 0,
    });
    const secondPage = await listMessagesInConversation({
      organizationId: org.id,
      conversationId: conversation.id,
      limit: 2,
      offset: 2,
    });
    expect(firstPage.length).toBe(2);
    expect(secondPage.length).toBe(2);
    const [m0, m1, m2, m3] = ordered as [string, string, string, string];
    expect(firstPage.map((m) => m.id)).toEqual([m3, m2]);
    expect(secondPage.map((m) => m.id)).toEqual([m1, m0]);
  });

  test("scopes lookup to the organization", async () => {
    const { org, owner, conversation } =
      await makeConversationWithContact("msg-list-scope");
    const message = await createMessage({
      organizationId: org.id,
      conversationId: conversation.id,
      direction: MESSAGE_DIRECTION.OUTBOUND,
      content: "scoped",
      actingUserId: owner.id,
    });

    const stranger = await makeUser("msg-list-stranger");
    const otherOrg = await createOrganization({
      name: `Elsewhere ${createId()}`,
      ownerUserId: stranger.id,
    });
    const leaked = await listMessagesInConversation({
      organizationId: otherOrg.id,
      conversationId: conversation.id,
      limit: 50,
      offset: 0,
    });
    expect(leaked.length).toBe(0);

    const byId = await getMessageInOrganization({
      id: message.id,
      organizationId: otherOrg.id,
    });
    expect(byId).toBeNull();
  });
});
