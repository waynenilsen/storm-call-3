import { publicProcedure, router } from "@/server/trpc/init";
import { authRouter } from "@/server/trpc/routers/auth";
import { calloutsRouter } from "@/server/trpc/routers/callouts";
import { contactsRouter } from "@/server/trpc/routers/contacts";
import { organizationsRouter } from "@/server/trpc/routers/organizations";

export const appRouter = router({
  time: publicProcedure.query(() => ({ now: new Date() })),
  auth: authRouter,
  organizations: organizationsRouter,
  contacts: contactsRouter,
  callouts: calloutsRouter,
});

export type AppRouter = typeof appRouter;
