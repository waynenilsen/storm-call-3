/** HttpOnly session cookie — name only; value is the opaque session token from {@link createSession}. */
export const SESSION_COOKIE_NAME = "session";

export function isSecureRequest(req: Request) {
  const forwarded = req.headers.get("x-forwarded-proto");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim().toLowerCase() === "https";
  }
  return new URL(req.url).protocol === "https:";
}

function sessionCookieBaseAttrs(secure: boolean) {
  const parts = [`Path=/`, `HttpOnly`, `SameSite=Lax`];
  if (secure) parts.push(`Secure`);
  return parts;
}

/**
 * Append a Set-Cookie header so the browser stores the session until {@param expiresAt}.
 */
export function appendSessionSetCookie(
  resHeaders: Headers,
  req: Request,
  token: string,
  expiresAt: Date,
) {
  const secure = isSecureRequest(req);
  const maxAge = Math.max(
    0,
    Math.ceil((expiresAt.getTime() - Date.now()) / 1000),
  );
  const value = encodeURIComponent(token);
  const parts = [
    `${SESSION_COOKIE_NAME}=${value}`,
    ...sessionCookieBaseAttrs(secure),
    `Max-Age=${maxAge}`,
  ];
  resHeaders.append(`Set-Cookie`, parts.join(`; `));
}

/** Append Set-Cookie that clears the session cookie in the browser. */
export function appendSessionClearCookie(resHeaders: Headers, req: Request) {
  const secure = isSecureRequest(req);
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    ...sessionCookieBaseAttrs(secure),
    `Max-Age=0`,
  ];
  resHeaders.append(`Set-Cookie`, parts.join(`; `));
}

export function getSessionTokenFromRequest(req: Request) {
  const header = req.headers.get(`cookie`);
  if (!header) return;
  for (const segment of header.split(`;`)) {
    const idx = segment.indexOf(`=`);
    if (idx === -1) continue;
    const name = segment.slice(0, idx).trim();
    if (name !== SESSION_COOKIE_NAME) continue;
    const raw = segment.slice(idx + 1).trim();
    if (!raw) return;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
}
