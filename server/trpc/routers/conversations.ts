import { TRPCError } from "@trpc/server";

import { requireMembership } from "@/lib/auth/authorization";
import { getConversationInOrganization } from "@/lib/conversations/get";
import { listConversationsInOrganization } from "@/lib/conversations/list";
import {
  conversationByIdInputSchema,
  listConversationsInputSchema,
} from "@/lib/conversations/schemas";
import { protectedProcedure, router } from "@/server/trpc/init";

export const conversationsRouter = router({
  list: protectedProcedure
    .input(listConversationsInputSchema)
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      return listConversationsInOrganization(input);
    }),

  get: protectedProcedure
    .input(conversationByIdInputSchema)
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      const conversation = await getConversationInOrganization(input);
      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }
      return conversation;
    }),
});
