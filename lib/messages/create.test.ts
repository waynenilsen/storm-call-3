import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { getConversationByContactId } from "@/lib/conversations/get";
import { createOrganization } from "@/lib/organizations/create";
import { makeConversationWithContact } from "@/test/test-conversation";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import {
  ConversationNotInOrganizationError,
  createMessage,
  InboundMessageMustNotHaveActorError,
  OutboundMessageRequiresActorError,
} from "./create";
import { MESSAGE_DIRECTION } from "./schemas";

describe("createMessage", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("outbound: stores actor audit fields and updates rollups (no unread bump)", async () => {
    const { org, owner, contact, conversation } =
      await makeConversationWithContact("msg-out");

    const before = Date.now();
    const message = await createMessage({
      organizationId: org.id,
      conversationId: conversation.id,
      direction: MESSAGE_DIRECTION.OUTBOUND,
      content: "Hello there",
      actingUserId: owner.id,
    });
    const after = Date.now();

    expect(message.organizationId).toBe(org.id);
    expect(message.conversationId).toBe(conversation.id);
    expect(message.direction).toBe("outbound");
    expect(message.sentByUserId).toBe(owner.id);
    expect(message.sentByUserName).toBe(owner.name);

    const refreshed = await getConversationByContactId({
      contactId: contact.id,
      organizationId: org.id,
    });
    expect(refreshed?.messageCount).toBe(1);
    expect(refreshed?.unreadCount).toBe(0);
    expect(refreshed?.lastMessageDirection).toBe("outbound");
    expect(refreshed?.lastMessagePreview).toBe("Hello there");
    expect(refreshed?.lastInboundAt).toBeNull();
    const lastAt = refreshed?.lastMessageAt?.getTime() ?? 0;
    expect(lastAt).toBeGreaterThanOrEqual(before);
    expect(lastAt).toBeLessThanOrEqual(after + 1000);
    expect(refreshed?.lastOutboundAt?.getTime()).toBe(lastAt);
  });

  test("inbound: leaves actor null and increments unreadCount", async () => {
    const { org, contact, conversation } =
      await makeConversationWithContact("msg-in");

    const message = await createMessage({
      organizationId: org.id,
      conversationId: conversation.id,
      direction: MESSAGE_DIRECTION.INBOUND,
      content: "Hi back",
      providerMessageId: "SM_test_123",
      status: "received",
    });

    expect(message.direction).toBe("inbound");
    expect(message.sentByUserId).toBeNull();
    expect(message.sentByUserName).toBeNull();
    expect(message.providerMessageId).toBe("SM_test_123");
    expect(message.status).toBe("received");

    const refreshed = await getConversationByContactId({
      contactId: contact.id,
      organizationId: org.id,
    });
    expect(refreshed?.messageCount).toBe(1);
    expect(refreshed?.unreadCount).toBe(1);
    expect(refreshed?.lastMessageDirection).toBe("inbound");
    expect(refreshed?.lastInboundAt).not.toBeNull();
    expect(refreshed?.lastOutboundAt).toBeNull();
  });

  test("rollups accumulate across mixed-direction messages", async () => {
    const { org, owner, contact, conversation } =
      await makeConversationWithContact("msg-mixed");

    await createMessage({
      organizationId: org.id,
      conversationId: conversation.id,
      direction: MESSAGE_DIRECTION.OUTBOUND,
      content: "first out",
      actingUserId: owner.id,
    });
    await createMessage({
      organizationId: org.id,
      conversationId: conversation.id,
      direction: MESSAGE_DIRECTION.INBOUND,
      content: "first in",
    });
    await createMessage({
      organizationId: org.id,
      conversationId: conversation.id,
      direction: MESSAGE_DIRECTION.INBOUND,
      content: "second in",
    });

    const refreshed = await getConversationByContactId({
      contactId: contact.id,
      organizationId: org.id,
    });
    expect(refreshed?.messageCount).toBe(3);
    expect(refreshed?.unreadCount).toBe(2);
    expect(refreshed?.lastMessageDirection).toBe("inbound");
    expect(refreshed?.lastMessagePreview).toBe("second in");
  });

  test("truncates preview at 120 chars with ellipsis", async () => {
    const { org, contact, conversation } =
      await makeConversationWithContact("msg-trunc");
    const long = "a".repeat(500);
    await createMessage({
      organizationId: org.id,
      conversationId: conversation.id,
      direction: MESSAGE_DIRECTION.INBOUND,
      content: long,
    });
    const refreshed = await getConversationByContactId({
      contactId: contact.id,
      organizationId: org.id,
    });
    expect(refreshed?.lastMessagePreview?.length).toBe(120);
    expect(refreshed?.lastMessagePreview?.endsWith("…")).toBe(true);
  });

  test("rejects outbound without actingUserId", async () => {
    const { org, conversation } =
      await makeConversationWithContact("msg-noact");
    await expect(
      createMessage({
        organizationId: org.id,
        conversationId: conversation.id,
        direction: MESSAGE_DIRECTION.OUTBOUND,
        content: "nope",
      }),
    ).rejects.toBeInstanceOf(OutboundMessageRequiresActorError);
  });

  test("rejects inbound that includes actingUserId", async () => {
    const { org, owner, conversation } =
      await makeConversationWithContact("msg-inbound-actor");
    await expect(
      createMessage({
        organizationId: org.id,
        conversationId: conversation.id,
        direction: MESSAGE_DIRECTION.INBOUND,
        content: "nope",
        actingUserId: owner.id,
      }),
    ).rejects.toBeInstanceOf(InboundMessageMustNotHaveActorError);
  });

  test("rejects when conversation is in a different organization", async () => {
    const { conversation } = await makeConversationWithContact("msg-bad-org");
    const stranger = await makeUser("msg-stranger");
    const otherOrg = await createOrganization({
      name: `Elsewhere ${createId()}`,
      ownerUserId: stranger.id,
    });
    await expect(
      createMessage({
        organizationId: otherOrg.id,
        conversationId: conversation.id,
        direction: MESSAGE_DIRECTION.OUTBOUND,
        content: "leak attempt",
        actingUserId: stranger.id,
      }),
    ).rejects.toBeInstanceOf(ConversationNotInOrganizationError);
  });
});
