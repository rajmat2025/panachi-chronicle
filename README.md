# Panachickal Family Digital Chronicle

An interactive, page-turning digital **book** of the Panachickal family. It reads the
existing family-tree database **(read-only)** and renders every family member — in
depth-first genealogical order — as an immersive parchment chronicle with a 3D
page-flip, dual-language (English + Malayalam) text, dynamic layouts, search, a
generation ribbon, and an image lightbox.

This is a **fully independent** application. It does not modify, import from, or
depend on the tree app in any way, and it **never writes** to the database.

## Guardrails

1. **No database writes** — no migrations here; the Prisma client blocks every
   write operation (`create`/`update`/`delete`/`executeRaw`) at runtime.
2. **No changes to the tree app** — the tree app is a reference only.
3. **Independent codebase** — its own repo, deps, schema, and config.
4. **Read-only DB usage** — the app only issues `SELECT`-style reads.

## Tech stack

- Next.js 15 (App Router) + React 19
- Prisma 6 → MySQL (read-only projection of the `people` / `media` tables)
- Tailwind CSS v4
- [`react-pageflip`](https://github.com/Nodlik/react-pageflip) for the 3D book

## Getting started

```bash
npm install           # also generates the read-only Prisma client
npm run dev           # http://localhost:3100
npm run build && npm start   # production build, also on port 3100
```

### Environment (`.env`)

```env
# Read-only connection to the existing family-tree database
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/panachi"

# Photos live only on the tree site
IMAGE_BASE_URL="https://tree.nuancedor.com"

# Optional: read-only listing of the tree's photo folder (empty = DB photos only)
PHOTOS_DIR="D:\projects\panachickal_tree\public\uploads\people"
```

### Photos

Photos are kept in one place — the tree site — and never copied into this repo. The
book lists each person's photos from the database (`profile_image_url`,
`spouse_profile_image_url`, `media`) and, when `PHOTOS_DIR` is set, also lists the
tree's `uploads/people/{branch}/{code}/` folder read-only so photos without a
database record still appear (refreshed every 10 minutes). Every path is then linked
to the tree site, e.g. `https://tree.nuancedor.com/uploads/people/A/A4_1/A4_1-1.jpg`
and `…/A4_1_spouse-1.jpg` for the spouse.

## Deploying to Hostinger (Node.js web app)

The chronicle runs next to the tree app on the same Hostinger account and reads the
same MySQL database with the same credentials.

1. hPanel → **Websites → Add website → Node.js app**, connect this GitHub repo
   (`main` branch).
2. Node version **20 or newer**. Install: `npm install` · Build: `npm run build` ·
   Start: `npm start`.
3. Environment variables (this website's own settings; the tree app's are not shared):
   - Recommended: `DATABASE_PASSWORD` = the tree app's MySQL password in plain text.
     User, host and database default to `u627857774_admin`, `127.0.0.1`,
     `u627857774_panachi` (override with `DATABASE_USER` / `DATABASE_HOST` /
     `DATABASE_NAME` if needed).
   - Or `DATABASE_URL` =
     `mysql://u627857774_admin:PASSWORD@127.0.0.1:3306/u627857774_panachi`
     (no quotes; write `@` in the password as `%40`).
   - `IMAGE_BASE_URL` = `https://tree.nuancedor.com`
   - `PHOTOS_DIR` = `/home/u627857774/domains/tree.nuancedor.com/uploads/people`
     (the tree's persistent photo folder). The runtime log reports
     `Found N photos in PHOTOS_DIR …` or `PHOTOS_DIR not readable …`.
4. Save, then **redeploy** (variables are only picked up by a new deployment).
   `npm start` runs `scripts/start.js`, which listens on Hostinger's `PORT`
   (3100 locally). There are no migrations: the chronicle never writes to the database.

Notes:

- Build tools (Prisma CLI, Tailwind, TypeScript) are regular dependencies so the build
  works on Hostinger, and `postinstall` generates the Prisma client there.
- `prisma/schema.prisma` includes the `debian-openssl-1.1.x` engine used by Hostinger.
- `IMAGE_BASE_URL` and `PHOTOS_DIR` are read at runtime; a restart is enough.

## How it works

- **Book order** — Cover → Contents → Family History (Malayalam, from
  `content/family-history.md`) → Family Index → one page per family in depth-first order.
- **Letter-size pages** — every page is a fixed 8.5 × 11 in page (816 × 1056 px) with
  1 in side margins. The screen view scales whole pages; **Print** (toolbar button or
  Ctrl+P) outputs one page per sheet with `@page { size: letter; margin: 0 }`. Type is
  set in points on a staggered scale (cover 34 → part 22 → names 18–21 → section 15 →
  body 11 → details 10 → index 9.5 → labels 7.5).
- **Pagination** — the history, contents and index flow across pages. The client
  measures them against the exact page content box after fonts load, splits long
  paragraphs between pages and keeps headings with the text that follows. Contents and
  index page numbers come from that layout, so they match the printed book.
- **Editing the history** — edit `content/family-history.md` (conventions are
  described in the comment at the top of the file); no code change is needed.
- **Not used** — the `people.original_name` column is deliberately not mapped.
- **Ordering** — the true hierarchy is rebuilt from `parentCode` links and traversed
  depth-first (`G → A → A1 → A1.1 → A1.2 → B`); siblings sort by `sortOrder` then a
  natural genealogy-code comparator (so `A1.2` precedes `A1.10`).
- **Family Cells** — each person + embedded spouse + direct children becomes one page.
  Children with no spouse and no children of their own (and only short notes) are
  shown in full on their parent's page instead of on a page of their own; the index
  and search point to the parent's page for them.
- **Template variants** (auto-selected from the data):
  - **Alpha** (media-rich): framed photo + wrapped biography when a photo exists.
  - **Beta** (text-centric): larger type + centered notes when there is no photo.
  - **Gamma** (index/sub-tree): a multi-column child directory for nodes with many children.
- **Navigation** — interactive Table of Contents, a persistent Generation Ribbon,
  and a global Search (by name or notation) all flip the book to the target page.
- **Lightbox** — any photo opens in a zoomable overlay without losing your page.

## Project layout

```
prisma/schema.prisma          Read-only DB projection
src/lib/db/                    Read-only Prisma client + queries
src/lib/genealogy/notation.ts  Natural genealogy-code comparator
content/family-history.md      Family history text (Malayalam), shown first in the book
src/lib/history/               Parser for the history text
src/lib/book/build-book.ts     Ordering, family cells, variants, index groups
src/components/book/           Book engine UI (flip, pages, variants, overlays)
src/app/                       App Router entry (server read → client book)
```
