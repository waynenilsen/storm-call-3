import { z } from "zod";

/**
 * Roles a user can hold within an organization. We only ship `OWNER` for now;
 * additional roles (e.g. ADMIN, MEMBER) will be added later.
 */
export const ORG_ROLE = {
  OWNER: "OWNER",
} as const;

export type OrgRole = (typeof ORG_ROLE)[keyof typeof ORG_ROLE];

export const organizationNameSchema = z.string().trim().min(1).max(200);

export const organizationIdSchema = z.string().min(1).max(64);

export const createOrganizationInputSchema = z.object({
  name: organizationNameSchema,
});
export type CreateOrganizationInput = z.infer<
  typeof createOrganizationInputSchema
>;

export const updateOrganizationInputSchema = z.object({
  id: organizationIdSchema,
  name: organizationNameSchema,
});
export type UpdateOrganizationInput = z.infer<
  typeof updateOrganizationInputSchema
>;

export const organizationByIdInputSchema = z.object({
  id: organizationIdSchema,
});
export type OrganizationByIdInput = z.infer<typeof organizationByIdInputSchema>;

export const listOrganizationsInputSchema = z.object({
  search: z.string().trim().max(200).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});
export type ListOrganizationsInput = z.infer<
  typeof listOrganizationsInputSchema
>;
