import fs from "fs";
import path from "path";

/**
 * Photo folder index (read-only).
 *
 * Photos live only on the tree site. When PHOTOS_DIR points at the tree's
 * `uploads/people` folder (on Hostinger both sites share one account), the
 * folder is listed so photos that were added without a database record still
 * appear. Files are never copied or modified; the returned paths are the
 * tree's public paths (`/uploads/people/...`), resolved against IMAGE_BASE_URL.
 *
 * Layout: {PHOTOS_DIR}/{branch}/{code}/, with dots in the code as underscores:
 *   Person photos:  {code}-1.jpg, {code}-2.jpg, …
 *   Spouse photos:  {code}_spouse-1.jpg, …
 */

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const PEOPLE_URL_PREFIX = "/uploads/people";
/** New uploads on the tree site show up within this long. */
const REFRESH_MS = 10 * 60 * 1000;

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

let cache: { builtAt: number; map: Map<string, LocalPhotos> } | null = null;

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

function buildIndex(root: string): Map<string, LocalPhotos> {
  const files: ScannedFile[] = [];
  if (fs.existsSync(root)) {
    walk(root, [], files);
    console.log(`[chronicle] Found ${files.length} photos in PHOTOS_DIR ${root}`);
  } else {
    console.warn(`[chronicle] PHOTOS_DIR not readable: ${root} (using database photos only)`);
  }

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

function getIndex(): Map<string, LocalPhotos> | null {
  const root = process.env.PHOTOS_DIR?.trim();
  if (!root) return null;
  if (!cache || Date.now() - cache.builtAt > REFRESH_MS) {
    cache = { builtAt: Date.now(), map: buildIndex(root) };
  }
  return cache.map;
}

/** Photo paths found in the tree's folder for a genealogy code (empty without PHOTOS_DIR). */
export function getLocalPhotos(genealogyCode: string): LocalPhotos {
  const safe = safeGenealogySegment(genealogyCode);
  return getIndex()?.get(safe) ?? { person: [], spouse: [] };
}
