import { compareGenealogyCodes, generationLabel } from "@/lib/genealogy/notation";
import type {
  ChildRef,
  ChronicleData,
  ChroniclePerson,
  FamilyCell,
  GenerationMarker,
  SearchEntry,
  TemplateVariant,
  TocGroup,
} from "@/types/chronicle";

/** A node with lots of direct children renders as a directory (Gamma). */
const GAMMA_CHILD_THRESHOLD = 6;

/** Childless, unmarried people with longer notes than this keep a page of their own. */
const INLINE_NOTES_LIMIT = 240;

/** Upstream d'Aboville codes (G, G.1, …) are stored with this branch code. */
const ANCESTRAL_BRANCH = "G6";

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

  for (const p of people) {
    if (!seen.has(p.genealogyCode)) {
      ordered.push(p);
      seen.add(p.genealogyCode);
    }
  }

  return ordered;
}

function groupKey(p: ChroniclePerson): string {
  return p.branchCode || ANCESTRAL_BRANCH;
}

/**
 * Assemble the family section of the book in depth-first order. Page numbers
 * are resolved on the client once the history section has been paginated.
 */
export function buildChronicle(people: ChroniclePerson[]): ChronicleData {
  const ordered = depthFirstOrder(people);
  const byCode = new Map(ordered.map((p) => [p.genealogyCode, p]));

  const directChildren = new Map<string, ChroniclePerson[]>();
  for (const p of ordered) {
    if (p.parentCode && byCode.has(p.parentCode)) {
      const list = directChildren.get(p.parentCode) ?? [];
      list.push(p);
      directChildren.set(p.parentCode, list);
    }
  }

  const isInline = (p: ChroniclePerson) =>
    !!p.parentCode &&
    byCode.has(p.parentCode) &&
    !hasText(p.spouseName) &&
    !directChildren.has(p.genealogyCode) &&
    (p.notes?.trim().length ?? 0) <= INLINE_NOTES_LIMIT;

  const pagePeople = ordered.filter((p) => !isInline(p));
  const cellIndexOf = new Map<string, number>();
  pagePeople.forEach((p, i) => cellIndexOf.set(p.genealogyCode, i));
  // Inline children resolve to their parent's page (parents always have a page).
  for (const p of ordered) {
    if (!cellIndexOf.has(p.genealogyCode)) {
      cellIndexOf.set(p.genealogyCode, cellIndexOf.get(p.parentCode!)!);
    }
  }

  const cells: FamilyCell[] = pagePeople.map((person) => {
    const kids = directChildren.get(person.genealogyCode) ?? [];
    const children: ChildRef[] = kids.map((k) => ({
      genealogyCode: k.genealogyCode,
      displayName: k.displayName,
      cellIndex: cellIndexOf.get(k.genealogyCode)!,
      ...(isInline(k) ? { inline: k } : {}),
    }));
    return { person, children, variant: selectVariant(person, kids.length) };
  });

  const tocGroups: TocGroup[] = [];
  let current: { branch: string; group: TocGroup } | null = null;
  // A branch can appear in several runs (the ancestral line resumes after
  // branches A–F), so indentation is relative to the branch's first person.
  const baseGeneration = new Map<string, number>();
  const runCount = new Map<string, number>();

  ordered.forEach((p) => {
    const branch = groupKey(p);
    if (!current || current.branch !== branch) {
      const run = (runCount.get(branch) ?? 0) + 1;
      runCount.set(branch, run);
      if (!baseGeneration.has(branch)) baseGeneration.set(branch, p.generationNumber);
      const root = byCode.get(branch);
      const base =
        branch === ANCESTRAL_BRANCH
          ? "Ancestral Line"
          : `Branch ${branch}${root ? ` · ${root.displayName}` : ""}`;
      current = {
        branch,
        group: {
          key: run === 1 ? branch : `${branch}-${run}`,
          label: run === 1 ? base : `${base} (continued)`,
          entries: [],
        },
      };
      tocGroups.push(current.group);
    }
    const groupBaseGeneration = baseGeneration.get(branch)!;
    current.group.entries.push({
      genealogyCode: p.genealogyCode,
      displayName: p.displayName,
      depth: Math.max(0, p.generationNumber - groupBaseGeneration),
      cellIndex: cellIndexOf.get(p.genealogyCode)!,
    });
  });

  const searchIndex: SearchEntry[] = ordered.map((p) => ({
    genealogyCode: p.genealogyCode,
    displayName: p.displayName,
    spouseName: p.spouseName,
    cellIndex: cellIndexOf.get(p.genealogyCode)!,
  }));

  const generations: GenerationMarker[] = [];
  const seenGen = new Set<number>();
  for (const p of ordered) {
    if (!seenGen.has(p.generationNumber)) {
      seenGen.add(p.generationNumber);
      generations.push({
        generationNumber: p.generationNumber,
        label: generationLabel(p.generationNumber),
        cellIndex: cellIndexOf.get(p.genealogyCode)!,
      });
    }
  }
  generations.sort((a, b) => a.generationNumber - b.generationNumber);

  return {
    cells,
    tocGroups,
    generations,
    searchIndex,
    totalPeople: ordered.length,
  };
}
