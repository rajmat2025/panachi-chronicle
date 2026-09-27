import type { FlowBlock } from "@/types/chronicle";
import { flowBlockSpec, vnodeToDom, type PageLabel } from "./flow-spec";

/** Placeholder page number used while measuring (numbers are fixed-width). */
const MEASURE_LABEL: PageLabel = () => "000";

const KEEP_WITH_NEXT = new Set<FlowBlock["kind"]>([
  "part",
  "section",
  "subsection",
  "minor",
  "subtitle",
  "toc-title",
  "toc-group",
]);

/** Words longer than this many characters are split so they can break across pages. */
const LONG_WORD_GRAPHEMES = 24;
const LONG_WORD_CHUNK = 6;

const graphemeSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("ml", { granularity: "grapheme" })
    : null;

function graphemes(text: string): string[] {
  return graphemeSegmenter
    ? Array.from(graphemeSegmenter.segment(text), (s) => s.segment)
    : Array.from(text);
}

/** Break paragraph text into units at which a page break may occur. */
function breakUnits(text: string): string[] {
  const words = text.match(/\S+\s*/g) ?? [text];
  const units: string[] = [];
  for (const word of words) {
    const g = graphemes(word);
    if (g.length > LONG_WORD_GRAPHEMES) {
      for (let i = 0; i < g.length; i += LONG_WORD_CHUNK) {
        units.push(g.slice(i, i + LONG_WORD_CHUNK).join(""));
      }
    } else {
      units.push(word);
    }
  }
  return units;
}

function buildNode(block: FlowBlock): HTMLElement {
  return vnodeToDom(flowBlockSpec(block, MEASURE_LABEL));
}

interface Placed {
  block: FlowBlock;
  node: HTMLElement;
}

/**
 * Pack flow blocks into pages by measuring them inside `box`, an off-screen
 * element with the exact size and classes of a page's content area.
 */
export function paginateFlow(blocks: FlowBlock[], box: HTMLElement): FlowBlock[][] {
  const pages: FlowBlock[][] = [];
  let placed: Placed[] = [];
  let splitCount = 0;

  box.replaceChildren();
  const fits = () => box.scrollHeight <= box.clientHeight + 1;

  const finishPage = () => {
    // Headings must not end a page: carry them over to the next one.
    const carry: Placed[] = [];
    while (placed.length > 1 && KEEP_WITH_NEXT.has(placed[placed.length - 1].block.kind)) {
      carry.unshift(placed.pop()!);
    }
    pages.push(placed.map((p) => p.block));
    placed = carry;
    box.replaceChildren(...carry.map((c) => c.node));
  };

  const splitParagraph = (
    block: Extract<FlowBlock, { kind: "para" }>
  ): { head: Placed; tail: FlowBlock } | null => {
    const units = breakUnits(block.text);
    if (units.length < 2) return null;

    const headFor = (count: number): Extract<FlowBlock, { kind: "para" }> => ({
      ...block,
      text: units.slice(0, count).join("").trimEnd(),
      continues: true,
    });

    let lo = 1;
    let hi = units.length - 1;
    let best = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const node = buildNode(headFor(mid));
      box.appendChild(node);
      const ok = fits();
      box.removeChild(node);
      if (ok) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (best === 0) return null;

    const head = headFor(best);
    const headNode = buildNode(head);
    box.appendChild(headNode);
    splitCount += 1;
    return {
      head: { block: head, node: headNode },
      tail: {
        ...block,
        id: `${block.id}~${splitCount}`,
        text: units.slice(best).join("").trimStart(),
        continued: true,
        continues: block.continues,
      },
    };
  };

  for (const block of blocks) {
    if (block.kind === "part" && placed.length > 0) finishPage();

    let pending: FlowBlock | null = block;
    while (pending) {
      const node = buildNode(pending);
      box.appendChild(node);
      if (fits()) {
        placed.push({ block: pending, node });
        pending = null;
        continue;
      }
      box.removeChild(node);

      if (pending.kind === "para") {
        const split = splitParagraph(pending);
        if (split) {
          placed.push(split.head);
          finishPage();
          pending = split.tail;
          continue;
        }
      }

      if (placed.length === 0) {
        // Taller than a whole page: place it anyway (it will be clipped).
        box.appendChild(node);
        placed.push({ block: pending, node });
        finishPage();
        pending = null;
        continue;
      }

      finishPage();
    }
  }

  if (placed.length > 0) pages.push(placed.map((p) => p.block));
  box.replaceChildren();
  return pages;
}

/** Create the hidden measuring box with the same classes as a page's content area. */
export function createMeasureBox(): { box: HTMLElement; dispose: () => void } {
  const root = document.createElement("div");
  root.className = "book-type";
  root.setAttribute("aria-hidden", "true");
  root.style.cssText =
    "position:fixed;left:-20000px;top:0;visibility:hidden;pointer-events:none;";
  const box = document.createElement("div");
  box.className = "letter-content flow";
  root.appendChild(box);
  document.body.appendChild(root);
  return { box, dispose: () => root.remove() };
}

/** Wait until the page fonts (Latin + Malayalam, regular + bold) are loaded. */
export async function waitForFonts(box: HTMLElement): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const probe = document.createElement("p");
  probe.className = "ml";
  probe.textContent = "മലയാളം Aa";
  box.appendChild(probe);
  const mlFamily = getComputedStyle(probe).fontFamily;
  const latinFamily = getComputedStyle(box).fontFamily;
  probe.remove();

  const sample = "മലയാളം Panachickal 0123";
  await Promise.all(
    [mlFamily, latinFamily].flatMap((family) => [
      document.fonts.load(`400 11pt ${family}`, sample),
      document.fonts.load(`700 11pt ${family}`, sample),
      document.fonts.load(`italic 400 11pt ${family}`, sample),
    ])
  ).catch(() => undefined);
  await document.fonts.ready;
}
