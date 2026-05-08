import { listActivitiesInOrganization } from "@/lib/activity/list";
import { listActivitiesInputSchema } from "@/lib/activity/schemas";
import { requireMembership } from "@/lib/auth/authorization";
import { protectedProcedure, router } from "@/server/trpc/init";

export const activityRouter = router({
  list: protectedProcedure
    .input(listActivitiesInputSchema)
    .query(async ({ ctx, input }) => {
      await requireMembership(ctx.user.id, input.organizationId);
      return listActivitiesInOrganization(input);
    }),
});
