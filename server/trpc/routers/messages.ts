import { TRPCError } from "@trpc/server";

import { requireMembership } from "@/lib/auth/authorization";
import {
  ConversationNotInOrganizationError,
  createMessage,
} from "@/lib/messages/create";
import { getMessageInOrganization } from "@/lib/messages/get";
import { listMessagesInConversation } from "@/lib/messages/list";
import {
  listMessagesInputSchema,
  MESSAGE_DIRECTION,
  messageByIdInputSchema,
  sendMessageInputSchema,
} from "@/lib/messages/schemas";
import { protectedProcedure, router } from "@/server/trpc/init";

export const messagesRouter = router({
  list: protectedProcedure
    .input(listMessagesInputSchema)
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      return listMessagesInConversation(input);
    }),

  get: protectedProcedure
    .input(messageByIdInputSchema)
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      const message = await getMessageInOrganization(input);
      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }
      return message;
    }),

  send: protectedProcedure
    .input(sendMessageInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      try {
        return await createMessage({
          ...input,
          direction: MESSAGE_DIRECTION.OUTBOUND,
          actingUserId: ctx.user.id,
        });
      } catch (e) {
        if (e instanceof ConversationNotInOrganizationError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }
        throw e;
      }
    }),
});
