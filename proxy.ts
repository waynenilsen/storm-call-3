import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isSafeInternalNextPath } from "@/lib/auth/nav";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (pathname.startsWith("/dashboard")) {
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.search = "";
      const nextTarget = `${pathname}${search}`;
      if (isSafeInternalNextPath(pathname)) {
        url.searchParams.set("next", nextTarget);
      }
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (
    hasSession &&
    (pathname === "/" || pathname === "/sign-in" || pathname === "/sign-up")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/sign-in", "/sign-up", "/dashboard/:path*"],
};
