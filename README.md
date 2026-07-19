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
npm install
npm run db:generate   # generate the read-only Prisma client
npm run dev           # http://localhost:3100
```

### Environment (`.env`)

```env
# Read-only connection to the existing family-tree database
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/panachi"

# Origin of the tree app that serves uploaded photos.
# Relative image paths are prefixed with this (dev: the tree dev server).
NEXT_PUBLIC_IMAGE_BASE_URL="http://localhost:3005"
```

Photos physically live with the tree app, so the chronicle references them by URL
rather than copying any files.

## How it works

- **Ordering** — the true hierarchy is rebuilt from `parentCode` links and traversed
  depth-first (`G → A → A1 → A1.1 → A1.2 → B`); siblings sort by `sortOrder` then a
  natural genealogy-code comparator (so `A1.2` precedes `A1.10`).
- **Family Cells** — each person + embedded spouse + direct children becomes one page.
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
src/lib/book/build-book.ts     Ordering, family cells, variants, pagination
src/components/book/           Book engine UI (flip, pages, variants, overlays)
src/app/                       App Router entry (server read → client book)
```
