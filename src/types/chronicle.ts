/**
 * Canonical, self-contained types for the Chronicle book engine.
 * Independent of the tree app — derived only from the read-only DB projection.
 */

export interface MediaItem {
  id: string;
  url: string;
  caption: string | null;
  subject: "PERSON" | "SPOUSE" | string;
}

/** A person as needed by the chronicle, plus embedded spouse fields. */
export interface ChroniclePerson {
  id: string;
  genealogyCode: string;
  parentCode: string | null;
  branchCode: string;
  generationNumber: number;
  sortOrder: number;

  displayName: string;
  otherName: string | null;
  familyName: string | null;
  place: string | null;
  qualification: string | null;

  spouseName: string | null;
  originalSpouseName: string | null;
  spouseFamilyName: string | null;
  spousePlace: string | null;
  spouseQualification: string | null;
  spouseDob: string | null;
  spouseDod: string | null;

  houseLocation: string | null;
  notes: string | null;
  dob: string | null;
  dod: string | null;
  profileImageUrl: string | null;
  spouseProfileImageUrl: string | null;

  media: MediaItem[];
}

/** A direct child reference shown inside a parent's family cell. */
export interface ChildRef {
  genealogyCode: string;
  displayName: string;
  /** The child's own family cell, or the parent's cell when shown inline. */
  cellIndex: number;
  /**
   * Set for children with no spouse and no children of their own: they are
   * shown in full on the parent's page instead of on a page of their own.
   */
  inline?: ChroniclePerson;
}

export type TemplateVariant = "alpha" | "beta" | "gamma";

/** A "Family Cell": main node + spouse + direct children. Renders as one page. */
export interface FamilyCell {
  person: ChroniclePerson;
  children: ChildRef[];
  variant: TemplateVariant;
}

export interface TocPersonEntry {
  genealogyCode: string;
  displayName: string;
  /** Depth below the group's first generation, used for indentation. */
  depth: number;
  cellIndex: number;
}

/** Contents grouping: the ancestral line, then root branches A–F. */
export interface TocGroup {
  key: string;
  label: string;
  entries: TocPersonEntry[];
}

export interface GenerationMarker {
  generationNumber: number;
  label: string;
  /** First family cell of this generation. */
  cellIndex: number;
}

export interface SearchEntry {
  genealogyCode: string;
  displayName: string;
  spouseName: string | null;
  cellIndex: number;
}

/** Everything the client needs to assemble the book. */
export interface ChronicleData {
  cells: FamilyCell[];
  tocGroups: TocGroup[];
  generations: GenerationMarker[];
  searchIndex: SearchEntry[];
  totalPeople: number;
}

/**
 * Flowing text blocks (family history, contents). These are paginated on the
 * client by measuring them against the fixed letter-size content box.
 */
export type BookPart = "contents" | "history" | "index" | "cells";

/** A link target relative to the start of a book part. */
export interface NavTarget {
  part: BookPart;
  offset: number;
}

export type FlowBlock =
  | { kind: "part"; id: string; text: string }
  | { kind: "section"; id: string; text: string }
  | { kind: "subsection"; id: string; text: string }
  | { kind: "minor"; id: string; text: string }
  | { kind: "subtitle"; id: string; text: string }
  | {
      kind: "para";
      id: string;
      text: string;
      /** Continues from the previous page (no first-line indent). */
      continued?: boolean;
      /** Continues onto the next page (justify the last line). */
      continues?: boolean;
    }
  | { kind: "note"; id: string; lines: string[] }
  | { kind: "list"; id: string; items: string[] }
  | { kind: "table"; id: string; header: string[]; rows: string[][] }
  | { kind: "toc-title"; id: string; text: string; subtitle?: string }
  | { kind: "toc-group"; id: string; text: string; ml?: boolean }
  | {
      kind: "toc-row";
      id: string;
      code?: string;
      text: string;
      depth: number;
      target: NavTarget;
      /** Malayalam heading text (history entries). */
      ml?: boolean;
    };

export type BookPage =
  | { kind: "cover" }
  | { kind: "flow"; part: "contents" | "history" | "index"; blocks: FlowBlock[] }
  | { kind: "cell"; cellIndex: number }
  | { kind: "back" };

/** First page index of each part of the book (the cover is page 0). */
export type PartStarts = Record<BookPart, number>;

export interface BookLayout {
  pages: BookPage[];
  starts: PartStarts;
}
