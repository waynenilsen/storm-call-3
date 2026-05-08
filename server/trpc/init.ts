import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";

import { getUserForSessionToken } from "@/lib/auth/resolve-session";
import { getSessionTokenFromRequest } from "@/lib/auth/session-cookie";

export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  const token = getSessionTokenFromRequest(opts.req);
  const user = token ? await getUserForSessionToken(token) : null;
  return {
    req: opts.req,
    resHeaders: opts.resHeaders,
    user,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
