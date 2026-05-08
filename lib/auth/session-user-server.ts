import { cookies } from "next/headers";

import { getUserForSessionToken } from "./resolve-session";
import { SESSION_COOKIE_NAME } from "./session-cookie";

/** Session user for Server Components (Node runtime — uses Prisma). */
export async function getSessionUserFromServerCookies() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return getUserForSessionToken(token);
}
