import { TRPCError } from "@trpc/server";

import { requireOwner } from "@/lib/auth/authorization";
import { createEmployee } from "@/lib/employees/create";
import { deleteEmployee } from "@/lib/employees/delete";
import { getEmployeeInOrganization } from "@/lib/employees/get";
import { listEmployeesInOrganization } from "@/lib/employees/list";
import { InvalidEmployeePhoneError } from "@/lib/employees/phone-us";
import {
  createEmployeeInputSchema,
  employeeByIdInputSchema,
  listEmployeesInputSchema,
  updateEmployeeInputSchema,
} from "@/lib/employees/schemas";
import {
  EmployeeNotInOrganizationError,
  updateEmployee,
} from "@/lib/employees/update";
import { protectedProcedure, router } from "@/server/trpc/init";

function throwInvalidPhone(e: unknown): never {
  if (e instanceof InvalidEmployeePhoneError) {
    throw new TRPCError({ code: "BAD_REQUEST", message: e.message });
  }
  throw e;
}

export const employeesRouter = router({
  list: protectedProcedure
    .input(listEmployeesInputSchema)
    .query(async ({ ctx, input }) => {
      await requireOwner(ctx.user.id, input.organizationId);
      return listEmployeesInOrganization(input);
    }),

  get: protectedProcedure
    .input(employeeByIdInputSchema)
    .query(async ({ ctx, input }) => {
      await requireOwner(ctx.user.id, input.organizationId);
      const row = await getEmployeeInOrganization(input);
      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }
      return row;
    }),

  create: protectedProcedure
    .input(createEmployeeInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireOwner(ctx.user.id, input.organizationId);
      try {
        return await createEmployee({
          ...input,
          actingUserId: ctx.user.id,
        });
      } catch (e) {
        throwInvalidPhone(e);
      }
    }),

  update: protectedProcedure
    .input(updateEmployeeInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireOwner(ctx.user.id, input.organizationId);
      try {
        return await updateEmployee({
          ...input,
          actingUserId: ctx.user.id,
        });
      } catch (e) {
        if (e instanceof EmployeeNotInOrganizationError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Employee not found",
          });
        }
        throwInvalidPhone(e);
      }
    }),

  delete: protectedProcedure
    .input(employeeByIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireOwner(ctx.user.id, input.organizationId);
      const result = await deleteEmployee(input);
      if (!result.ok) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found",
        });
      }
      return result;
    }),
});
