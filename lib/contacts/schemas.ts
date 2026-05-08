import { z } from "zod";

import { organizationIdSchema } from "../organizations/schemas";

export const contactIdSchema = z.string().min(1).max(64);

/** Client-supplied phone before service-layer US → E.164 normalization (libphonenumber-js). */
export const contactOptionalPhoneRawSchema = z.preprocess((v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") return v;
  const t = v.trim();
  return t === "" ? undefined : t;
}, z.string().max(64).optional());

export const createContactInputSchema = z.object({
  organizationId: organizationIdSchema,
  name: z.string().trim().min(1).max(200).optional(),
  email: z.string().trim().email().max(254).optional(),
  phone: contactOptionalPhoneRawSchema,
});
export type CreateContactInput = z.infer<typeof createContactInputSchema>;

export const updateContactInputSchema = z
  .object({
    id: contactIdSchema,
    organizationId: organizationIdSchema,
    name: z.string().trim().min(1).max(200).optional(),
    email: z.string().trim().email().max(254).optional(),
    phone: contactOptionalPhoneRawSchema,
  })
  .refine(
    (v) =>
      v.name !== undefined || v.email !== undefined || v.phone !== undefined,
    { message: "at least one of name, email, or phone must be provided" },
  );
export type UpdateContactInput = z.infer<typeof updateContactInputSchema>;

export const contactByIdInputSchema = z.object({
  id: contactIdSchema,
  organizationId: organizationIdSchema,
});
export type ContactByIdInput = z.infer<typeof contactByIdInputSchema>;

export const listContactsInputSchema = z.object({
  organizationId: organizationIdSchema,
  search: z.string().trim().max(200).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});
export type ListContactsInput = z.infer<typeof listContactsInputSchema>;
