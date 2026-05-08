import { completePasswordReset } from "@/lib/auth/complete-password-reset";
import { requestPasswordReset } from "@/lib/auth/request-password-reset";
import {
  completePasswordResetInputSchema,
  requestPasswordResetInputSchema,
  signInInputSchema,
  signUpInputSchema,
} from "@/lib/auth/schemas";
import { createSession } from "@/lib/auth/session";
import {
  appendSessionClearCookie,
  appendSessionSetCookie,
  getSessionTokenFromRequest,
} from "@/lib/auth/session-cookie";
import { signIn } from "@/lib/auth/sign-in";
import { signOut } from "@/lib/auth/sign-out";
import { signUp } from "@/lib/auth/sign-up";
import { sendEmail } from "@/lib/email";
import { renderPasswordResetEmail } from "@/lib/email/render-password-reset";
import { prisma } from "@/lib/prisma";
import { resolveAuthenticatedLandingPath } from "@/lib/routing/authenticated-landing";
import { publicProcedure, router } from "@/server/trpc/init";

function resolveAppUrl() {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const port = process.env.PORT?.trim() || "3000";
  return `http://localhost:${port}`;
}

export const authRouter = router({
  session: publicProcedure.query(({ ctx }) => ctx.user),

  signUp: publicProcedure
    .input(signUpInputSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await prisma.$transaction((tx) => signUp(input, tx));
      if (!result.created) {
        return result;
      }
      appendSessionSetCookie(
        ctx.resHeaders,
        ctx.req,
        result.session.token,
        result.session.expiresAt,
      );
      const redirectPath = await resolveAuthenticatedLandingPath(
        result.user.id,
      );
      return {
        created: true as const,
        user: result.user,
        redirectPath,
      };
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
      const redirectPath = await resolveAuthenticatedLandingPath(
        result.user.id,
      );
      return {
        ok: true as const,
        user: result.user,
        redirectPath,
      };
    }),

  signOut: publicProcedure.mutation(async ({ ctx }) => {
    const token = getSessionTokenFromRequest(ctx.req);
    if (token) {
      await prisma.$transaction((tx) => signOut({ token }, tx));
    }
    appendSessionClearCookie(ctx.resHeaders, ctx.req);
    return { ok: true as const };
  }),

  requestPasswordReset: publicProcedure
    .input(requestPasswordResetInputSchema)
    .mutation(async ({ input, ctx }) => {
      const userAgent = ctx.req.headers.get("user-agent");
      const ipAddress =
        ctx.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

      const result = await prisma.$transaction((tx) =>
        requestPasswordReset(input, tx, { ipAddress, userAgent }),
      );

      if (result.emailPayload) {
        const { email, name, token, expiresAt } = result.emailPayload;
        const resetUrl = `${resolveAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
        const expiresInMinutes = Math.max(
          1,
          Math.round((expiresAt.getTime() - Date.now()) / 60_000),
        );
        try {
          const { html, text } = await renderPasswordResetEmail({
            resetUrl,
            expiresInMinutes,
          });
          await sendEmail({
            to: { email, name },
            subject: "Reset your Storm Call password",
            html,
            text,
          });
        } catch (err) {
          // Best-effort: still return ok to preserve no-enumeration behavior.
          // The token row is already persisted; user can request another link.
          console.error("[auth] failed to send password reset email", err);
        }
      }

      return { ok: true as const };
    }),

  completePasswordReset: publicProcedure
    .input(completePasswordResetInputSchema)
    .mutation(async ({ input }) => {
      return prisma.$transaction((tx) => completePasswordReset(input, tx));
    }),
});
