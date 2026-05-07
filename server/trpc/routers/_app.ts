import { publicProcedure, router } from "@/server/trpc/init";
import { authRouter } from "@/server/trpc/routers/auth";

export const appRouter = router({
  time: publicProcedure.query(() => ({ now: new Date() })),
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
