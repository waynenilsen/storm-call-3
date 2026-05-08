import { z } from "zod";

import { organizationIdSchema } from "../organizations/schemas";

export const equipmentIdSchema = z.string().min(1).max(64);

export const MECHANICAL_STATUS = {
  OPERATIONAL: "operational",
  ISSUES: "issues",
  NOT_OPERATIONAL: "notoperational",
} as const;
export type MechanicalStatus =
  (typeof MECHANICAL_STATUS)[keyof typeof MECHANICAL_STATUS];
export const mechanicalStatusSchema = z.enum([
  MECHANICAL_STATUS.OPERATIONAL,
  MECHANICAL_STATUS.ISSUES,
  MECHANICAL_STATUS.NOT_OPERATIONAL,
]);

export const TOOL_STATUS = {
  TOOLED: "tooled",
  PARTIALLY_TOOLED: "partiallyTooled",
  NOT_TOOLED: "notTooled",
} as const;
export type ToolStatus = (typeof TOOL_STATUS)[keyof typeof TOOL_STATUS];
export const toolStatusSchema = z.enum([
  TOOL_STATUS.TOOLED,
  TOOL_STATUS.PARTIALLY_TOOLED,
  TOOL_STATUS.NOT_TOOLED,
]);

export const createEquipmentInputSchema = z.object({
  organizationId: organizationIdSchema,
  companyCode: z.string().trim().min(1).max(120).optional(),
  type: z.string().trim().min(1).max(120).optional(),
  subtype: z.string().trim().min(1).max(120).optional(),
  mechanicalStatus: mechanicalStatusSchema.optional(),
  toolStatus: toolStatusSchema.optional(),
  notes: z.string().trim().max(4000).optional(),
});
export type CreateEquipmentInput = z.infer<typeof createEquipmentInputSchema>;

export const updateEquipmentInputSchema = z
  .object({
    id: equipmentIdSchema,
    organizationId: organizationIdSchema,
    companyCode: z.string().trim().max(120).nullable().optional(),
    type: z.string().trim().max(120).nullable().optional(),
    subtype: z.string().trim().max(120).nullable().optional(),
    mechanicalStatus: mechanicalStatusSchema.nullable().optional(),
    toolStatus: toolStatusSchema.nullable().optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
  })
  .refine(
    (v) =>
      v.companyCode !== undefined ||
      v.type !== undefined ||
      v.subtype !== undefined ||
      v.mechanicalStatus !== undefined ||
      v.toolStatus !== undefined ||
      v.notes !== undefined,
    { message: "at least one field must be provided" },
  );
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentInputSchema>;

export const equipmentByIdInputSchema = z.object({
  id: equipmentIdSchema,
  organizationId: organizationIdSchema,
});
export type EquipmentByIdInput = z.infer<typeof equipmentByIdInputSchema>;

export const listEquipmentInputSchema = z.object({
  organizationId: organizationIdSchema,
  search: z.string().trim().max(200).optional(),
  mechanicalStatus: mechanicalStatusSchema.optional(),
  toolStatus: toolStatusSchema.optional(),
  type: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});
export type ListEquipmentInput = z.infer<typeof listEquipmentInputSchema>;
