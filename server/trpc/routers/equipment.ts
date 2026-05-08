import { TRPCError } from "@trpc/server";

import { requireMembership } from "@/lib/auth/authorization";
import { createEquipment } from "@/lib/equipment/create";
import { deleteEquipment } from "@/lib/equipment/delete";
import { getEquipmentInOrganization } from "@/lib/equipment/get";
import { listEquipmentInOrganization } from "@/lib/equipment/list";
import {
  createEquipmentInputSchema,
  equipmentByIdInputSchema,
  listEquipmentInputSchema,
  updateEquipmentInputSchema,
} from "@/lib/equipment/schemas";
import { updateEquipment } from "@/lib/equipment/update";
import { prisma } from "@/lib/prisma";
import { protectedProcedure, router } from "@/server/trpc/init";

export const equipmentRouter = router({
  list: protectedProcedure
    .input(listEquipmentInputSchema)
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      return listEquipmentInOrganization(input);
    }),

  get: protectedProcedure
    .input(equipmentByIdInputSchema)
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      const equipment = await getEquipmentInOrganization(input);
      if (!equipment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Equipment not found",
        });
      }
      return equipment;
    }),

  create: protectedProcedure
    .input(createEquipmentInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      return prisma.$transaction((tx) =>
        createEquipment({ ...input, actingUserId: ctx.user.id }, tx),
      );
    }),

  update: protectedProcedure
    .input(updateEquipmentInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      return prisma.$transaction((tx) =>
        updateEquipment({ ...input, actingUserId: ctx.user.id }, tx),
      );
    }),

  delete: protectedProcedure
    .input(equipmentByIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      return prisma.$transaction((tx) => deleteEquipment(input, tx));
    }),
});
