import { redirect } from "next/navigation";

import { resolveAuthenticatedLandingPath } from "@/lib/routing/authenticated-landing";

import { getSessionUserFromServerCookies } from "./session-user-server";

/**
 * Require a database-valid session (invalid/expired cookies yield null) or send
 * the user to sign-in with a safe return path.
 */
export async function requireSessionUserSsr(signInReturnPath: string) {
  const user = await getSessionUserFromServerCookies();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(signInReturnPath)}`);
  }
  return user;
}

/** If the session cookie resolves to a user, go to the canonical app landing. */
export async function redirectToAuthenticatedLandingIfSessionSsr() {
  const user = await getSessionUserFromServerCookies();
  if (!user) {
    return;
  }
  redirect(await resolveAuthenticatedLandingPath(user.id));
}
