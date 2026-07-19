/** Presentation helpers for the chronicle. */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Format an ISO date string as "12 March 1948". Returns null if unusable. */
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Build a "b. 1948 – d. 2011" style life-span string when data exists. */
export function lifespan(
  dob: string | null | undefined,
  dod: string | null | undefined
): string | null {
  const b = formatDate(dob);
  const d = formatDate(dod);
  if (b && d) return `b. ${b} — d. ${d}`;
  if (b) return `b. ${b}`;
  if (d) return `d. ${d}`;
  return null;
}

export function hasText(v: string | null | undefined): boolean {
  return !!v && v.trim().length > 0;
}
