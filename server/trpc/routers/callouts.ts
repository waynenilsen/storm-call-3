import { TRPCError } from "@trpc/server";

import { requireMembership } from "@/lib/auth/authorization";
import { createCallout } from "@/lib/callouts/create";
import { deleteCallout } from "@/lib/callouts/delete";
import { getCalloutInOrganization } from "@/lib/callouts/get";
import { listCalloutsInOrganization } from "@/lib/callouts/list";
import {
  calloutByIdInputSchema,
  createCalloutInputSchema,
  listCalloutsInputSchema,
  updateCalloutInputSchema,
} from "@/lib/callouts/schemas";
import { updateCallout } from "@/lib/callouts/update";
import { protectedProcedure, router } from "@/server/trpc/init";

export const calloutsRouter = router({
  list: protectedProcedure
    .input(listCalloutsInputSchema)
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      return listCalloutsInOrganization(input);
    }),

  get: protectedProcedure
    .input(calloutByIdInputSchema)
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      const callout = await getCalloutInOrganization(input);
      if (!callout) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Callout not found",
        });
      }
      return callout;
    }),

  create: protectedProcedure
    .input(createCalloutInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      return createCallout({ ...input, actingUserId: ctx.user.id });
    }),

  update: protectedProcedure
    .input(updateCalloutInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      return updateCallout({ ...input, actingUserId: ctx.user.id });
    }),

  delete: protectedProcedure
    .input(calloutByIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      return deleteCallout(input);
    }),
});
