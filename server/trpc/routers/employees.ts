import { TRPCError } from "@trpc/server";

import { requireMembership } from "@/lib/auth/authorization";
import { createEmployee } from "@/lib/employees/create";
import { deleteEmployee } from "@/lib/employees/delete";
import { getEmployeeInOrganization } from "@/lib/employees/get";
import { listEmployeesInOrganization } from "@/lib/employees/list";
import {
  createEmployeeInputSchema,
  employeeByIdInputSchema,
  listEmployeesInputSchema,
  updateEmployeeInputSchema,
} from "@/lib/employees/schemas";
import { updateEmployee } from "@/lib/employees/update";
import { prisma } from "@/lib/prisma";
import { protectedProcedure, router } from "@/server/trpc/init";

export const employeesRouter = router({
  list: protectedProcedure
    .input(listEmployeesInputSchema)
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      return listEmployeesInOrganization(input);
    }),

  get: protectedProcedure
    .input(employeeByIdInputSchema)
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      const employee = await getEmployeeInOrganization(input);
      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }
      return employee;
    }),

  create: protectedProcedure
    .input(createEmployeeInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      return prisma.$transaction((tx) =>
        createEmployee({ ...input, actingUserId: ctx.user.id }, tx),
      );
    }),

  update: protectedProcedure
    .input(updateEmployeeInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      return prisma.$transaction((tx) =>
        updateEmployee({ ...input, actingUserId: ctx.user.id }, tx),
      );
    }),

  delete: protectedProcedure
    .input(employeeByIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      return prisma.$transaction((tx) => deleteEmployee(input, tx));
    }),
});
