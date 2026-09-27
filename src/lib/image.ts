/**
 * Resolve a stored image path to a fully-qualified URL.
 *
 * Photos live only on the tree site. The server prefixes relative paths like
 * `/uploads/people/A/A4/A4-1.jpg` with IMAGE_BASE_URL (see `imageBaseUrl`)
 * before data reaches the browser, so client components receive absolute URLs,
 * which are returned unchanged.
 */
export function resolveImageUrl(
  url: string | null | undefined,
  base = ""
): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base.replace(/\/+$/, "")}${path}`;
}

/** Origin that serves `/uploads/people/...` (server-only; read at runtime). */
export function imageBaseUrl(): string {
  return (process.env.IMAGE_BASE_URL ?? "https://tree.nuancedor.com").trim();
}
