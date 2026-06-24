import { z } from "zod";

import { contactIdSchema } from "../contacts/schemas";
import { organizationIdSchema } from "../organizations/schemas";

export const employeeIdSchema = z.string().min(1).max(64);

export const createEmployeeInputSchema = z.object({
  organizationId: organizationIdSchema,
  contactId: contactIdSchema,
  notes: z.string().trim().max(4000).optional(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeInputSchema>;

export const updateEmployeeInputSchema = z
  .object({
    id: employeeIdSchema,
    organizationId: organizationIdSchema,
    contactId: contactIdSchema.optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
  })
  .refine((v) => v.contactId !== undefined || v.notes !== undefined, {
    message: "at least one field must be provided",
  });
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeInputSchema>;

export const employeeByIdInputSchema = z.object({
  id: employeeIdSchema,
  organizationId: organizationIdSchema,
});
export type EmployeeByIdInput = z.infer<typeof employeeByIdInputSchema>;

export const listEmployeesInputSchema = z.object({
  organizationId: organizationIdSchema,
  search: z.string().trim().max(200).optional(),
  contactId: contactIdSchema.optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});
export type ListEmployeesInput = z.infer<typeof listEmployeesInputSchema>;
