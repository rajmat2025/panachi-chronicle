import { compareGenealogyCodes, generationLabel } from "@/lib/genealogy/notation";
import type {
  BookPage,
  ChildRef,
  ChronicleBook,
  ChroniclePerson,
  FamilyCell,
  GenerationMarker,
  SearchEntry,
  TemplateVariant,
  TocEntry,
} from "@/types/chronicle";

/** A node with lots of direct children renders as a directory (Gamma). */
const GAMMA_CHILD_THRESHOLD = 6;

/** TOC entries per TOC page. */
const TOC_ENTRIES_PER_PAGE = 22;

function hasText(v: string | null | undefined): boolean {
  return !!v && v.trim().length > 0;
}

/** Choose the layout variant from the shape of the family cell's data. */
function selectVariant(person: ChroniclePerson, childCount: number): TemplateVariant {
  if (childCount >= GAMMA_CHILD_THRESHOLD) return "gamma";
  if (hasText(person.profileImageUrl)) return "alpha";
  return "beta";
}

/**
 * Rebuild the true family hierarchy from parentCode links and produce a
 * depth-first ordering: parent, then each subtree in sibling order.
 */
function depthFirstOrder(people: ChroniclePerson[]): ChroniclePerson[] {
  const byCode = new Map<string, ChroniclePerson>();
  for (const p of people) byCode.set(p.genealogyCode, p);

  const childrenOf = new Map<string, ChroniclePerson[]>();
  const roots: ChroniclePerson[] = [];

  for (const p of people) {
    const parent = p.parentCode;
    if (parent && byCode.has(parent)) {
      const list = childrenOf.get(parent) ?? [];
      list.push(p);
      childrenOf.set(parent, list);
    } else {
      roots.push(p);
    }
  }

  const siblingSort = (a: ChroniclePerson, b: ChroniclePerson) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return compareGenealogyCodes(a.genealogyCode, b.genealogyCode);
  };

  roots.sort(siblingSort);
  for (const list of childrenOf.values()) list.sort(siblingSort);

  const ordered: ChroniclePerson[] = [];
  const seen = new Set<string>();

  const visit = (node: ChroniclePerson) => {
    if (seen.has(node.genealogyCode)) return; // guard against cycles
    seen.add(node.genealogyCode);
    ordered.push(node);
    const kids = childrenOf.get(node.genealogyCode);
    if (kids) for (const kid of kids) visit(kid);
  };

  for (const root of roots) visit(root);

  // Safety: append any orphans not reached (shouldn't happen with clean data).
  for (const p of people) {
    if (!seen.has(p.genealogyCode)) {
      ordered.push(p);
      seen.add(p.genealogyCode);
    }
  }

  return ordered;
}

/**
 * Assemble the full book: cover → TOC pages → one family-cell page per person
 * (in depth-first order), plus TOC / generation / search indices with correct
 * page anchors.
 */
export function buildBook(people: ChroniclePerson[]): ChronicleBook {
  const ordered = depthFirstOrder(people);

  // Precompute direct children per code for cell rendering.
  const directChildren = new Map<string, ChroniclePerson[]>();
  const byCode = new Map<string, ChroniclePerson>();
  for (const p of ordered) byCode.set(p.genealogyCode, p);
  for (const p of ordered) {
    if (p.parentCode && byCode.has(p.parentCode)) {
      const list = directChildren.get(p.parentCode) ?? [];
      list.push(p);
      directChildren.set(p.parentCode, list);
    }
  }

  // Front matter: 1 cover page + N toc pages. Compute TOC page count first.
  const tocPageCount = Math.max(1, Math.ceil(ordered.length / TOC_ENTRIES_PER_PAGE));
  const firstCellPage = 1 + tocPageCount; // after cover + toc pages

  // Map each person to its final page index.
  const pageIndexOf = new Map<string, number>();
  ordered.forEach((p, i) => pageIndexOf.set(p.genealogyCode, firstCellPage + i));

  // Build family cells.
  const cells: FamilyCell[] = ordered.map((person) => {
    const kids = directChildren.get(person.genealogyCode) ?? [];
    const children: ChildRef[] = kids.map((k) => ({
      genealogyCode: k.genealogyCode,
      displayName: k.displayName,
      originalName: k.originalName,
      pageIndex: pageIndexOf.get(k.genealogyCode)!,
    }));
    return {
      person,
      children,
      variant: selectVariant(person, kids.length),
    };
  });

  // TOC entries (in book order).
  const toc: TocEntry[] = ordered.map((p) => ({
    genealogyCode: p.genealogyCode,
    displayName: p.displayName,
    originalName: p.originalName,
    generationNumber: p.generationNumber,
    branchCode: p.branchCode,
    pageIndex: pageIndexOf.get(p.genealogyCode)!,
  }));

  // Search index.
  const searchIndex: SearchEntry[] = ordered.map((p) => ({
    genealogyCode: p.genealogyCode,
    displayName: p.displayName,
    originalName: p.originalName,
    spouseName: p.spouseName,
    pageIndex: pageIndexOf.get(p.genealogyCode)!,
  }));

  // Generation markers: first page where each generation appears.
  const generations: GenerationMarker[] = [];
  const seenGen = new Set<number>();
  for (const p of ordered) {
    if (!seenGen.has(p.generationNumber)) {
      seenGen.add(p.generationNumber);
      generations.push({
        generationNumber: p.generationNumber,
        pageIndex: pageIndexOf.get(p.genealogyCode)!,
        label: generationLabel(p.generationNumber),
      });
    }
  }
  generations.sort((a, b) => a.generationNumber - b.generationNumber);

  // Assemble pages array.
  const pages: BookPage[] = [];
  pages.push({ index: 0, kind: "cover" });

  for (let t = 0; t < tocPageCount; t++) {
    const start = t * TOC_ENTRIES_PER_PAGE;
    pages.push({
      index: 1 + t,
      kind: "toc",
      tocEntries: toc.slice(start, start + TOC_ENTRIES_PER_PAGE),
    });
  }

  cells.forEach((cell, i) => {
    pages.push({ index: firstCellPage + i, kind: "cell", cell });
  });

  // Ensure an even count for clean dual-page spreads (add a back page if odd).
  if (pages.length % 2 !== 0) {
    pages.push({ index: pages.length, kind: "back" });
  }

  return {
    pages,
    toc,
    generations,
    searchIndex,
    firstCellPage,
    totalPeople: ordered.length,
  };
}
