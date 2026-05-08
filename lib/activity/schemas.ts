import { z } from "zod";

import { organizationIdSchema } from "../organizations/schemas";

export const RESOURCE_TYPE = {
  CONTACT: "contact",
  EQUIPMENT: "equipment",
  CALLOUT: "callout",
  CONVERSATION: "conversation",
  MESSAGE: "message",
  ORGANIZATION: "organization",
} as const;
export type ResourceType = (typeof RESOURCE_TYPE)[keyof typeof RESOURCE_TYPE];
export const resourceTypeSchema = z.enum([
  RESOURCE_TYPE.CONTACT,
  RESOURCE_TYPE.EQUIPMENT,
  RESOURCE_TYPE.CALLOUT,
  RESOURCE_TYPE.CONVERSATION,
  RESOURCE_TYPE.MESSAGE,
  RESOURCE_TYPE.ORGANIZATION,
]);

export const ACTIVITY_ACTION = {
  CONTACT_CREATED: "contact.created",
  CONTACT_UPDATED: "contact.updated",
  CONTACT_DELETED: "contact.deleted",
  EQUIPMENT_CREATED: "equipment.created",
  EQUIPMENT_UPDATED: "equipment.updated",
  EQUIPMENT_DELETED: "equipment.deleted",
  CALLOUT_CREATED: "callout.created",
  CALLOUT_UPDATED: "callout.updated",
  CALLOUT_DELETED: "callout.deleted",
  CONVERSATION_CREATED: "conversation.created",
  MESSAGE_SENT_OUTBOUND: "message.sent_outbound",
  ORGANIZATION_CREATED: "organization.created",
  ORGANIZATION_UPDATED: "organization.updated",
} as const;
export type ActivityAction =
  (typeof ACTIVITY_ACTION)[keyof typeof ACTIVITY_ACTION];

export const listActivitiesInputSchema = z.object({
  organizationId: organizationIdSchema,
  resourceType: resourceTypeSchema.optional(),
  resourceId: z.string().min(1).max(64).optional(),
  actorUserId: z.string().min(1).max(64).optional(),
  action: z.string().min(1).max(120).optional(),
  since: z.coerce.date().optional(),
  until: z.coerce.date().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});
export type ListActivitiesInput = z.infer<typeof listActivitiesInputSchema>;
