/**
 * Genealogy notation helpers for depth-first book ordering.
 *
 * Source codes look like:
 *   Upstream (gens 1-6):  G, G.1, G.1.1.1.1.4
 *   Branch roots (gen 7): A, B, C, D, E, F
 *   Descendants:          A1, A1.1, A1.2, A1.10, B3.2.1
 *
 * The physical page order is depth-first: a node is immediately followed by its
 * descendants, and siblings are ordered numerically (so A1.2 precedes A1.10).
 *
 * We primarily rebuild the true hierarchy from parentCode links (see data layer),
 * and use this natural comparator only to order siblings deterministically.
 */

/** Split a code into comparable tokens: letters and numbers, numbers as numeric. */
function tokenize(code: string): Array<{ n: number | null; s: string }> {
  const parts = code.split(".");
  const tokens: Array<{ n: number | null; s: string }> = [];
  for (const part of parts) {
    // Split a segment like "A1" into ["A", "1"], or "12" into ["12"], "G" into ["G"].
    const chunks = part.match(/\d+|\D+/g) ?? [part];
    for (const chunk of chunks) {
      if (/^\d+$/.test(chunk)) {
        tokens.push({ n: parseInt(chunk, 10), s: chunk });
      } else {
        tokens.push({ n: null, s: chunk });
      }
    }
  }
  return tokens;
}

/**
 * Natural comparison of two genealogy codes.
 * Numeric segments compare by value; alpha segments compare lexically.
 * Numeric sorts before alpha at the same position.
 */
export function compareGenealogyCodes(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  const len = Math.min(ta.length, tb.length);

  for (let i = 0; i < len; i++) {
    const x = ta[i];
    const y = tb[i];

    if (x.n !== null && y.n !== null) {
      if (x.n !== y.n) return x.n - y.n;
    } else if (x.n !== null) {
      return -1; // numeric before alpha
    } else if (y.n !== null) {
      return 1;
    } else if (x.s !== y.s) {
      return x.s < y.s ? -1 : 1;
    }
  }

  return ta.length - tb.length; // shorter (ancestor) comes first
}

/** Human-friendly generation label. */
export function generationLabel(generationNumber: number): string {
  return `Generation ${generationNumber}`;
}
