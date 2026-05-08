import { z } from "zod";

import { contactIdSchema } from "../contacts/schemas";
import { organizationIdSchema } from "../organizations/schemas";

export const conversationIdSchema = z.string().min(1).max(64);

export const createConversationInputSchema = z.object({
  organizationId: organizationIdSchema,
  contactId: contactIdSchema,
});
export type CreateConversationInput = z.infer<
  typeof createConversationInputSchema
>;

export const conversationByIdInputSchema = z.object({
  id: conversationIdSchema,
  organizationId: organizationIdSchema,
});
export type ConversationByIdInput = z.infer<typeof conversationByIdInputSchema>;

export const listConversationsInputSchema = z.object({
  organizationId: organizationIdSchema,
  contactId: contactIdSchema.optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});
export type ListConversationsInput = z.infer<
  typeof listConversationsInputSchema
>;
