import { z } from "zod";

import { conversationIdSchema } from "../conversations/schemas";
import { organizationIdSchema } from "../organizations/schemas";

export const messageIdSchema = z.string().min(1).max(64);

export const MESSAGE_DIRECTION = {
  INBOUND: "inbound",
  OUTBOUND: "outbound",
} as const;
export type MessageDirection =
  (typeof MESSAGE_DIRECTION)[keyof typeof MESSAGE_DIRECTION];

export const messageDirectionSchema = z.enum([
  MESSAGE_DIRECTION.INBOUND,
  MESSAGE_DIRECTION.OUTBOUND,
]);

const messageContentSchema = z.string().trim().min(1).max(1600);

/**
 * Shape used by callers ingesting a message — outbound from a user in the
 * org, or inbound from a contact (typically via webhook). The service layer
 * decides what to do with optional provider metadata.
 */
export const createMessageInputSchema = z.object({
  organizationId: organizationIdSchema,
  conversationId: conversationIdSchema,
  content: messageContentSchema,
  direction: messageDirectionSchema,
  providerMessageId: z.string().trim().min(1).max(128).optional(),
  status: z.string().trim().min(1).max(64).optional(),
  errorCode: z.string().trim().min(1).max(64).optional(),
});
export type CreateMessageInput = z.infer<typeof createMessageInputSchema>;

/**
 * Outbound-only shape for the user-facing send action. Direction is forced to
 * 'outbound' server-side; provider metadata is filled in by the SMS adapter,
 * not by the client.
 */
export const sendMessageInputSchema = z.object({
  organizationId: organizationIdSchema,
  conversationId: conversationIdSchema,
  content: messageContentSchema,
});
export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;

export const messageByIdInputSchema = z.object({
  id: messageIdSchema,
  organizationId: organizationIdSchema,
});
export type MessageByIdInput = z.infer<typeof messageByIdInputSchema>;

export const listMessagesInputSchema = z.object({
  organizationId: organizationIdSchema,
  conversationId: conversationIdSchema,
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});
export type ListMessagesInput = z.infer<typeof listMessagesInputSchema>;
