import { publicProcedure, router } from "@/server/trpc/init";
import { authRouter } from "@/server/trpc/routers/auth";
import { organizationsRouter } from "@/server/trpc/routers/organizations";

export const appRouter = router({
  time: publicProcedure.query(() => ({ now: new Date() })),
  auth: authRouter,
  organizations: organizationsRouter,
});

export type AppRouter = typeof appRouter;
