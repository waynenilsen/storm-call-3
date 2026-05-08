import { TRPCError } from "@trpc/server";

import { requireOwner } from "@/lib/auth/authorization";
import { createContact } from "@/lib/contacts/create";
import { deleteContact } from "@/lib/contacts/delete";
import { getContactInOrganization } from "@/lib/contacts/get";
import { listContactsInOrganization } from "@/lib/contacts/list";
import { InvalidContactPhoneError } from "@/lib/contacts/phone-us";
import {
  contactByIdInputSchema,
  createContactInputSchema,
  listContactsInputSchema,
  updateContactInputSchema,
} from "@/lib/contacts/schemas";
import {
  ContactNotInOrganizationError,
  updateContact,
} from "@/lib/contacts/update";
import { prisma } from "@/lib/prisma";
import { protectedProcedure, router } from "@/server/trpc/init";

function throwInvalidPhone(e: unknown): never {
  if (e instanceof InvalidContactPhoneError) {
    throw new TRPCError({ code: "BAD_REQUEST", message: e.message });
  }
  throw e;
}

export const contactsRouter = router({
  list: protectedProcedure
    .input(listContactsInputSchema)
    .query(async ({ ctx, input }) => {
      await requireOwner(ctx.user.id, input.organizationId);
      return listContactsInOrganization(input);
    }),

  get: protectedProcedure
    .input(contactByIdInputSchema)
    .query(async ({ ctx, input }) => {
      await requireOwner(ctx.user.id, input.organizationId);
      const row = await getContactInOrganization(input);
      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contact not found",
        });
      }
      return row;
    }),

  create: protectedProcedure
    .input(createContactInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireOwner(ctx.user.id, input.organizationId);
      try {
        return await prisma.$transaction((tx) =>
          createContact(
            {
              ...input,
              actingUserId: ctx.user.id,
            },
            tx,
          ),
        );
      } catch (e) {
        throwInvalidPhone(e);
      }
    }),

  update: protectedProcedure
    .input(updateContactInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireOwner(ctx.user.id, input.organizationId);
      try {
        return await prisma.$transaction((tx) =>
          updateContact(
            {
              ...input,
              actingUserId: ctx.user.id,
            },
            tx,
          ),
        );
      } catch (e) {
        if (e instanceof ContactNotInOrganizationError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contact not found",
          });
        }
        throwInvalidPhone(e);
      }
    }),

  delete: protectedProcedure
    .input(contactByIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireOwner(ctx.user.id, input.organizationId);
      const result = await prisma.$transaction((tx) =>
        deleteContact(input, tx),
      );
      if (!result.ok) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contact not found",
        });
      }
      return result;
    }),
});
