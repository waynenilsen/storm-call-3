import { publicProcedure, router } from "@/server/trpc/init";
import { activityRouter } from "@/server/trpc/routers/activity";
import { authRouter } from "@/server/trpc/routers/auth";
import { calloutsRouter } from "@/server/trpc/routers/callouts";
import { contactsRouter } from "@/server/trpc/routers/contacts";
import { conversationsRouter } from "@/server/trpc/routers/conversations";
import { employeesRouter } from "@/server/trpc/routers/employees";
import { equipmentRouter } from "@/server/trpc/routers/equipment";
import { messagesRouter } from "@/server/trpc/routers/messages";
import { organizationsRouter } from "@/server/trpc/routers/organizations";

export const appRouter = router({
  time: publicProcedure.query(() => ({ now: new Date() })),
  auth: authRouter,
  organizations: organizationsRouter,
  contacts: contactsRouter,
  callouts: calloutsRouter,
  conversations: conversationsRouter,
  messages: messagesRouter,
  equipment: equipmentRouter,
  activity: activityRouter,
  employees: employeesRouter,
});

export type AppRouter = typeof appRouter;
