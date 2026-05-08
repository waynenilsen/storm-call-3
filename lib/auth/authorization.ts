/**
 * Authorization: who is allowed to do what **after** we know who they are.
 *
 * **Authentication** (elsewhere: session cookie, `protectedProcedure`, `ctx.user`)
 * answers “is this request from a logged-in user, and which user?”. It does not
 * decide whether that user may touch a given organization or resource.
 *
 * **Authorization** in this module answers “given this `userId`, may they perform
 * this action on this resource?”. It belongs in `lib/auth` so tRPC and future
 * layers can share the same rules as the policy surface grows (org roles, app
 * roles, feature flags, etc.). Prefer throwing {@link TRPCError} here only when
 * the check is performed in a tRPC-shaped boundary; keep helpers pure where
 * a caller needs a boolean instead.
 */

import { TRPCError } from "@trpc/server";

import { getMembership } from "@/lib/organizations/membership";
import { ORG_ROLE } from "@/lib/organizations/schemas";

/** Ensures the user is an owner of the organization; throws `NOT_FOUND` or `FORBIDDEN` otherwise. */
export async function requireOwner(userId: string, organizationId: string) {
  const membership = await getMembership({ userId, organizationId });
  if (!membership) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found",
    });
  }
  if (membership.role !== ORG_ROLE.OWNER) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only owners can perform this action",
    });
  }
}
