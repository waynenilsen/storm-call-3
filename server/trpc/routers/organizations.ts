import { TRPCError } from "@trpc/server";

import { requireOwner } from "@/lib/auth/authorization";
import { createOrganization } from "@/lib/organizations/create";
import { deleteOrganization } from "@/lib/organizations/delete";
import { getOrganizationForUser } from "@/lib/organizations/get";
import { getOrganizationForUserBySlug } from "@/lib/organizations/get-by-slug";
import { listOrganizationsForUser } from "@/lib/organizations/list";
import {
  createOrganizationInputSchema,
  listOrganizationsInputSchema,
  organizationByIdInputSchema,
  organizationBySlugInputSchema,
  updateOrganizationInputSchema,
} from "@/lib/organizations/schemas";
import { updateOrganization } from "@/lib/organizations/update";
import { prisma } from "@/lib/prisma";
import { protectedProcedure, router } from "@/server/trpc/init";

export const organizationsRouter = router({
  list: protectedProcedure
    .input(listOrganizationsInputSchema)
    .query(({ ctx, input }) => listOrganizationsForUser(ctx.user.id, input)),

  get: protectedProcedure
    .input(organizationByIdInputSchema)
    .query(async ({ ctx, input }) => {
      const org = await getOrganizationForUser({
        organizationId: input.id,
        userId: ctx.user.id,
      });
      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }
      return org;
    }),

  getBySlug: protectedProcedure
    .input(organizationBySlugInputSchema)
    .query(async ({ ctx, input }) => {
      const org = await getOrganizationForUserBySlug({
        userId: ctx.user.id,
        slug: input.slug,
      });
      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }
      return org;
    }),

  create: protectedProcedure
    .input(createOrganizationInputSchema)
    .mutation(async ({ ctx, input }) =>
      prisma.$transaction((tx) =>
        createOrganization({ ...input, ownerUserId: ctx.user.id }, tx),
      ),
    ),

  update: protectedProcedure
    .input(updateOrganizationInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireOwner(ctx.user.id, input.id);
      return prisma.$transaction((tx) => updateOrganization(input, tx));
    }),

  delete: protectedProcedure
    .input(organizationByIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireOwner(ctx.user.id, input.id);
      return prisma.$transaction((tx) =>
        deleteOrganization({ id: input.id }, tx),
      );
    }),
});
