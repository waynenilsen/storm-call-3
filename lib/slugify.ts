/**
 * URL-safe slug: lowercase, non-alphanumerics → single hyphens, trimmed edges.
 * Does not guarantee non-empty; callers should substitute a fallback when needed.
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
