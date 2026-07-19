import fs from "fs";
import path from "path";

/**
 * Local photo index.
 *
 * Photos live in this app's own `public/uploads/people/{branch}/{code}/` folders,
 * named after the genealogy notation (dots → underscores), matching the source
 * layout:
 *   Person photos:  {code}-1.jpg, {code}-2.jpg, …
 *   Spouse photos:  {code}_spouse-1.jpg, …
 *
 * We scan the folder tree so EVERY available photo is surfaced in the chronicle,
 * regardless of whether the database recorded it. This is read-only disk access.
 */

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const PEOPLE_URL_PREFIX = "/uploads/people";

export interface LocalPhotos {
  person: string[];
  spouse: string[];
}

/** Folder/file-safe segment for a genealogy code (mirrors the source app). */
export function safeGenealogySegment(code: string): string {
  return code.replace(/\./g, "_").replace(/[^A-Za-z0-9_-]/g, "_");
}

interface ScannedFile {
  code: string; // parent folder name = safe genealogy code
  url: string;
  isSpouse: boolean;
  index: number;
}

let cache: Map<string, LocalPhotos> | null = null;

function trailingIndex(filename: string): number {
  const m = filename.match(/-(\d+)\.[^.]+$/);
  return m ? parseInt(m[1], 10) : 0;
}

function walk(dir: string, relParts: string[], out: ScannedFile[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, [...relParts, entry.name], out);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;

    // Immediate parent folder is the genealogy code (skip files sitting
    // directly under the branch/people root with no code folder).
    const code = relParts[relParts.length - 1];
    if (!code) continue;

    const url = [PEOPLE_URL_PREFIX, ...relParts, entry.name].join("/");
    out.push({
      code,
      url,
      isSpouse: /_spouse\b|_spouse-/.test(entry.name),
      index: trailingIndex(entry.name),
    });
  }
}

function buildIndex(): Map<string, LocalPhotos> {
  const root = path.join(process.cwd(), "public", "uploads", "people");
  const files: ScannedFile[] = [];
  walk(root, [], files);

  const byCode = new Map<string, ScannedFile[]>();
  for (const f of files) {
    const list = byCode.get(f.code) ?? [];
    list.push(f);
    byCode.set(f.code, list);
  }

  const map = new Map<string, LocalPhotos>();
  for (const [code, list] of byCode) {
    const person = list
      .filter((f) => !f.isSpouse)
      .sort((a, b) => a.index - b.index || a.url.localeCompare(b.url))
      .map((f) => f.url);
    const spouse = list
      .filter((f) => f.isSpouse)
      .sort((a, b) => a.index - b.index || a.url.localeCompare(b.url))
      .map((f) => f.url);
    map.set(code, { person, spouse });
  }
  return map;
}

function getIndex(): Map<string, LocalPhotos> {
  // Cache in production; rebuild each call in dev so newly added photos appear.
  if (process.env.NODE_ENV === "production") {
    if (!cache) cache = buildIndex();
    return cache;
  }
  return buildIndex();
}

/** Return locally-available person & spouse photo URLs for a genealogy code. */
export function getLocalPhotos(genealogyCode: string): LocalPhotos {
  const safe = safeGenealogySegment(genealogyCode);
  return getIndex().get(safe) ?? { person: [], spouse: [] };
}
