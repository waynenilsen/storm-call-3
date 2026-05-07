import { getUserForSessionToken } from "@/lib/auth/resolve-session";
import { signInInputSchema, signUpInputSchema } from "@/lib/auth/schemas";
import { createSession } from "@/lib/auth/session";
import {
  appendSessionClearCookie,
  appendSessionSetCookie,
  getSessionTokenFromRequest,
} from "@/lib/auth/session-cookie";
import { signIn } from "@/lib/auth/sign-in";
import { signOut } from "@/lib/auth/sign-out";
import { signUp } from "@/lib/auth/sign-up";
import { prisma } from "@/lib/prisma";
import { publicProcedure, router } from "@/server/trpc/init";

export const authRouter = router({
  session: publicProcedure.query(async ({ ctx }) => {
    const token = getSessionTokenFromRequest(ctx.req);
    if (!token) {
      return null;
    }
    return getUserForSessionToken(token);
  }),

  signUp: publicProcedure
    .input(signUpInputSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await signUp(input);
      if (!result.created) {
        return result;
      }
      appendSessionSetCookie(
        ctx.resHeaders,
        ctx.req,
        result.session.token,
        result.session.expiresAt,
      );
      return { created: true as const, user: result.user };
    }),

  signIn: publicProcedure
    .input(signInInputSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await prisma.$transaction(async (tx) => {
        const auth = await signIn(input, tx);
        if (!auth.ok) {
          return auth;
        }
        const session = await createSession({ userId: auth.user.id }, tx);
        return { ok: true as const, user: auth.user, session };
      });

      if (!result.ok) {
        return result;
      }
      appendSessionSetCookie(
        ctx.resHeaders,
        ctx.req,
        result.session.token,
        result.session.expiresAt,
      );
      return { ok: true as const, user: result.user };
    }),

  signOut: publicProcedure.mutation(async ({ ctx }) => {
    const token = getSessionTokenFromRequest(ctx.req);
    if (token) {
      await signOut({ token });
    }
    appendSessionClearCookie(ctx.resHeaders, ctx.req);
    return { ok: true as const };
  }),
});
