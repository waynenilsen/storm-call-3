import { publicProcedure, router } from "@/server/trpc/init";

export const appRouter = router({
  time: publicProcedure.query(() => ({ now: new Date() })),
});

export type AppRouter = typeof appRouter;
