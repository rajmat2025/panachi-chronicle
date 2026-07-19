/**
 * Resolve a stored image path to a fully-qualified URL.
 *
 * Photos physically live with the tree app. Relative paths like
 * `/uploads/people/A/A4/A4-1.jpg` are prefixed with NEXT_PUBLIC_IMAGE_BASE_URL
 * (the tree app origin). Absolute URLs are returned unchanged.
 */
export function resolveImageUrl(
  url: string | null | undefined
): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }
  const base = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "").replace(/\/+$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}
