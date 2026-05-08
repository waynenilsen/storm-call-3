import { z } from "zod";

import { organizationIdSchema } from "../organizations/schemas";

export const calloutIdSchema = z.string().min(1).max(64);

export const createCalloutInputSchema = z.object({
  organizationId: organizationIdSchema,
  name: z.string().trim().min(1).max(200),
  messageText: z.string().trim().min(1).max(1600),
});
export type CreateCalloutInput = z.infer<typeof createCalloutInputSchema>;

export const updateCalloutInputSchema = z
  .object({
    id: calloutIdSchema,
    organizationId: organizationIdSchema,
    name: z.string().trim().min(1).max(200).optional(),
    messageText: z.string().trim().min(1).max(1600).optional(),
  })
  .refine((v) => v.name !== undefined || v.messageText !== undefined, {
    message: "at least one of name or messageText must be provided",
  });
export type UpdateCalloutInput = z.infer<typeof updateCalloutInputSchema>;

export const calloutByIdInputSchema = z.object({
  id: calloutIdSchema,
  organizationId: organizationIdSchema,
});
export type CalloutByIdInput = z.infer<typeof calloutByIdInputSchema>;

export const listCalloutsInputSchema = z.object({
  organizationId: organizationIdSchema,
  search: z.string().trim().max(200).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});
export type ListCalloutsInput = z.infer<typeof listCalloutsInputSchema>;
