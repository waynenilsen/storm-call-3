/** Validate same-origin relative paths for post-login redirects (no open redirects). */
export function isSafeInternalNextPath(path: string) {
  if (!path.startsWith("/")) {
    return false;
  }
  if (path.startsWith("//")) {
    return false;
  }
  // Reject scheme-relative or absolute URLs stuffed into `next`
  if (path.includes("://")) {
    return false;
  }
  return true;
}

export function normalizeClientNextParam(
  next: string | null | undefined,
  fallback = "/dashboard",
) {
  if (!next || !isSafeInternalNextPath(next)) {
    return fallback;
  }
  return next;
}
