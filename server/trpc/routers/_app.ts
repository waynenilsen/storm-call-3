import { publicProcedure, router } from "@/server/trpc/init";
import { authRouter } from "@/server/trpc/routers/auth";
import { calloutsRouter } from "@/server/trpc/routers/callouts";
import { employeesRouter } from "@/server/trpc/routers/employees";
import { organizationsRouter } from "@/server/trpc/routers/organizations";

export const appRouter = router({
  time: publicProcedure.query(() => ({ now: new Date() })),
  auth: authRouter,
  organizations: organizationsRouter,
  employees: employeesRouter,
  callouts: calloutsRouter,
});

export type AppRouter = typeof appRouter;
