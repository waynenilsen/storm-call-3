import { z } from "zod";

import { organizationIdSchema } from "../organizations/schemas";

export const employeeIdSchema = z.string().min(1).max(64);

/** Client-supplied phone before service-layer US → E.164 normalization (libphonenumber-js). */
export const employeeOptionalPhoneRawSchema = z.preprocess((v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") return v;
  const t = v.trim();
  return t === "" ? undefined : t;
}, z.string().max(64).optional());

export const createEmployeeInputSchema = z.object({
  organizationId: organizationIdSchema,
  name: z.string().trim().min(1).max(200).optional(),
  email: z.string().trim().email().max(254).optional(),
  phone: employeeOptionalPhoneRawSchema,
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeInputSchema>;

export const updateEmployeeInputSchema = z
  .object({
    id: employeeIdSchema,
    organizationId: organizationIdSchema,
    name: z.string().trim().min(1).max(200).optional(),
    email: z.string().trim().email().max(254).optional(),
    phone: employeeOptionalPhoneRawSchema,
  })
  .refine(
    (v) =>
      v.name !== undefined || v.email !== undefined || v.phone !== undefined,
    { message: "at least one of name, email, or phone must be provided" },
  );
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeInputSchema>;

export const employeeByIdInputSchema = z.object({
  id: employeeIdSchema,
  organizationId: organizationIdSchema,
});
export type EmployeeByIdInput = z.infer<typeof employeeByIdInputSchema>;

export const listEmployeesInputSchema = z.object({
  organizationId: organizationIdSchema,
  search: z.string().trim().max(200).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});
export type ListEmployeesInput = z.infer<typeof listEmployeesInputSchema>;
