import { createId } from "@paralleldrive/cuid2";
import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { messageRowSelect } from "./row-select";
import { type CreateMessageInput, MESSAGE_DIRECTION } from "./schemas";

export class ConversationNotInOrganizationError extends Error {
  constructor() {
    super("conversation not found in organization");
    this.name = "ConversationNotInOrganizationError";
  }
}

export class OutboundMessageRequiresActorError extends Error {
  constructor() {
    super("outbound message requires actingUserId");
    this.name = "OutboundMessageRequiresActorError";
  }
}

export class InboundMessageMustNotHaveActorError extends Error {
  constructor() {
    super("inbound message must not include actingUserId");
    this.name = "InboundMessageMustNotHaveActorError";
  }
}

const PREVIEW_MAX = 120;

function buildPreview(content: string) {
  if (content.length <= PREVIEW_MAX) return content;
  return `${content.slice(0, PREVIEW_MAX - 1)}…`;
}

/**
 * Insert a message and atomically refresh the parent Conversation's denormalized
 * rollups. `actingUserId` is required for outbound (a user in the org sending to
 * the contact) and must be absent for inbound (the contact texting in).
 */
export async function createMessage(
  params: CreateMessageInput & { actingUserId?: string },
  tx?: PrismaTransaction,
) {
  const isOutbound = params.direction === MESSAGE_DIRECTION.OUTBOUND;
  if (isOutbound && !params.actingUserId) {
    throw new OutboundMessageRequiresActorError();
  }
  if (!isOutbound && params.actingUserId) {
    throw new InboundMessageMustNotHaveActorError();
  }

  const run = async (runner: PrismaTransaction | PrismaClient) => {
    const conversation = await runner.conversation.findFirst({
      where: {
        id: params.conversationId,
        organizationId: params.organizationId,
      },
      select: { id: true },
    });
    if (!conversation) throw new ConversationNotInOrganizationError();

    let sentByUserId: string | null = null;
    let sentByUserName: string | null = null;
    if (isOutbound && params.actingUserId) {
      const actor = await runner.user.findUniqueOrThrow({
        where: { id: params.actingUserId },
        select: { id: true, name: true },
      });
      sentByUserId = actor.id;
      sentByUserName = actor.name;
    }

    const now = new Date();
    const preview = buildPreview(params.content);

    const message = await runner.message.create({
      data: {
        id: createId(),
        organizationId: params.organizationId,
        conversationId: params.conversationId,
        content: params.content,
        direction: params.direction,
        sentByUserId,
        sentByUserName,
        providerMessageId: params.providerMessageId,
        status: params.status,
        errorCode: params.errorCode,
        createdAt: now,
      },
      select: messageRowSelect,
    });

    // Refresh denormalized rollups so the inbox list and conversation header
    // can render without aggregating the messages table.
    await runner.conversation.update({
      where: { id: params.conversationId },
      data: {
        lastMessageAt: now,
        lastMessagePreview: preview,
        lastMessageDirection: params.direction,
        ...(isOutbound
          ? { lastOutboundAt: now }
          : { lastInboundAt: now, unreadCount: { increment: 1 } }),
        messageCount: { increment: 1 },
      },
    });

    return message;
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
