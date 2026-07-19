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
  originalName: string | null;
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
  originalName: string | null;
  /** Page index the child's own family cell lives on (for anchor links). */
  pageIndex: number;
}

export type TemplateVariant = "alpha" | "beta" | "gamma";

/** A "Family Cell": main node + spouse + direct children. Renders as one page. */
export interface FamilyCell {
  person: ChroniclePerson;
  children: ChildRef[];
  variant: TemplateVariant;
}

export type BookPageKind = "cover" | "toc" | "cell" | "back";

export interface BookPage {
  index: number;
  kind: BookPageKind;
  cell?: FamilyCell;
  /** For TOC pages: the slice of entries shown on this page. */
  tocEntries?: TocEntry[];
}

export interface TocEntry {
  genealogyCode: string;
  displayName: string;
  originalName: string | null;
  generationNumber: number;
  branchCode: string;
  pageIndex: number;
}

export interface GenerationMarker {
  generationNumber: number;
  /** First page index where this generation appears. */
  pageIndex: number;
  label: string;
}

export interface SearchEntry {
  genealogyCode: string;
  displayName: string;
  originalName: string | null;
  spouseName: string | null;
  pageIndex: number;
}

export interface ChronicleBook {
  pages: BookPage[];
  toc: TocEntry[];
  generations: GenerationMarker[];
  searchIndex: SearchEntry[];
  /** page index of the first family cell (for "start reading"). */
  firstCellPage: number;
  totalPeople: number;
}
