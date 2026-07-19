"use client";

import type { FamilyCell, ChildRef, ChroniclePerson } from "@/types/chronicle";
import { hasText, lifespan } from "@/lib/format";
import { resolveImageUrl } from "@/lib/image";
import type { LightboxImage } from "./LightboxContext";
import { Divider, InfoRow, NameBanner, Photo } from "./ui";

function personGallery(p: ChroniclePerson): LightboxImage[] {
  const imgs: LightboxImage[] = [];
  if (hasText(p.profileImageUrl)) imgs.push({ url: p.profileImageUrl!, caption: p.displayName });
  for (const m of p.media) {
    if ((m.subject ?? "PERSON") !== "SPOUSE") imgs.push({ url: m.url, caption: m.caption });
  }
  return dedupe(imgs);
}

function spouseGallery(p: ChroniclePerson): LightboxImage[] {
  const imgs: LightboxImage[] = [];
  if (hasText(p.spouseProfileImageUrl))
    imgs.push({ url: p.spouseProfileImageUrl!, caption: p.spouseName });
  for (const m of p.media) {
    if ((m.subject ?? "PERSON") === "SPOUSE") imgs.push({ url: m.url, caption: m.caption });
  }
  return dedupe(imgs);
}

function dedupe(imgs: LightboxImage[]): LightboxImage[] {
  const seen = new Set<string>();
  const out: LightboxImage[] = [];
  for (const i of imgs) {
    const key = resolveImageUrl(i.url) ?? i.url;
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(i);
    }
  }
  return out;
}

function ChildrenDirectory({
  children,
  columns,
  onNavigate,
}: {
  children: ChildRef[];
  columns: number;
  onNavigate: (pageIndex: number) => void;
}) {
  if (children.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-heritage-700">
        Children
      </p>
      <ul
        className="gap-x-6 gap-y-1"
        style={{ columnCount: columns, columnGap: "1.5rem" }}
      >
        {children.map((c) => (
          <li key={c.genealogyCode} className="mb-1 break-inside-avoid">
            <button
              type="button"
              onClick={() => onNavigate(c.pageIndex)}
              className="group w-full text-left"
            >
              <span className="mr-1.5 text-[11px] font-semibold text-heritage-600">
                {c.genealogyCode}
              </span>
              <span className="text-sm text-ink-900 underline-offset-2 group-hover:underline">
                {c.displayName}
              </span>
              {c.originalName && c.originalName.trim() ? (
                <span className="malayalam ml-1 text-xs text-heritage-700">
                  {c.originalName}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpouseBlock({
  person,
  showPhoto,
}: {
  person: ChroniclePerson;
  showPhoto: boolean;
}) {
  if (!hasText(person.spouseName)) return null;
  const span = lifespan(person.spouseDob, person.spouseDod);
  const gallery = spouseGallery(person);
  return (
    <div className="mt-3 rounded border border-heritage-700/25 bg-parchment-50/50 p-3">
      <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-heritage-700">
        Spouse
      </p>
      <div className="flex items-start gap-3">
        {showPhoto && hasText(person.spouseProfileImageUrl) ? (
          <Photo
            url={person.spouseProfileImageUrl}
            alt={person.spouseName ?? "Spouse"}
            gallery={gallery}
            className="w-20 shrink-0"
            imgClassName="aspect-[3/4]"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <NameBanner
            name={person.spouseName!}
            original={person.originalSpouseName}
            size="sm"
          />
          <div className="mt-1 space-y-0.5">
            <InfoRow label="Family" value={person.spouseFamilyName} />
            <InfoRow label="Place" value={person.spousePlace} />
            <InfoRow label="Qualification" value={person.spouseQualification} />
            {span ? (
              <p className="text-center text-xs italic text-ink-700">{span}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Variant Alpha — media-rich: framed photo + wrapped biography. */
function AlphaLayout({
  cell,
  onNavigate,
}: {
  cell: FamilyCell;
  onNavigate: (pageIndex: number) => void;
}) {
  const p = cell.person;
  const span = lifespan(p.dob, p.dod);
  return (
    <div>
      <NameBanner
        name={p.displayName}
        original={p.originalName}
        code={p.genealogyCode}
        className="mb-2"
      />
      {span ? (
        <p className="mb-2 text-center text-xs italic text-ink-700">{span}</p>
      ) : null}
      <Divider className="mb-3" />
      <div className="clearfix">
        <Photo
          url={p.profileImageUrl}
          alt={p.displayName}
          gallery={personGallery(p)}
          className="float-left mr-4 mb-2 w-32 md:w-40"
          imgClassName="aspect-[3/4]"
        />
        <div className="space-y-1">
          <InfoRow label="Other name" value={p.otherName} />
          <InfoRow label="Family" value={p.familyName} />
          <InfoRow label="Place" value={p.place} />
          <InfoRow label="Qualification" value={p.qualification} />
          <InfoRow label="House" value={p.houseLocation} />
        </div>
        {hasText(p.notes) ? (
          <p className="mt-2 text-justify text-sm leading-relaxed text-ink-800">
            {p.notes}
          </p>
        ) : null}
      </div>
      <div className="clear-both" />
      <SpouseBlock person={p} showPhoto />
      {cell.children.length > 0 ? (
        <div className="mt-3">
          <Divider className="mb-2" />
          <ChildrenDirectory children={cell.children} columns={2} onNavigate={onNavigate} />
        </div>
      ) : null}
    </div>
  );
}

/** Variant Beta — text-centric: larger type, centered notes, dividers. */
function BetaLayout({
  cell,
  onNavigate,
}: {
  cell: FamilyCell;
  onNavigate: (pageIndex: number) => void;
}) {
  const p = cell.person;
  const span = lifespan(p.dob, p.dod);
  return (
    <div className="flex h-full flex-col">
      <NameBanner
        name={p.displayName}
        original={p.originalName}
        code={p.genealogyCode}
        className="mb-1"
      />
      {span ? (
        <p className="mb-2 text-center text-sm italic text-ink-700">{span}</p>
      ) : null}
      <Divider className="mb-4" />
      <div className="mx-auto max-w-md space-y-1.5 text-center">
        {[
          { label: "Place", value: p.place },
          { label: "Profession", value: p.qualification },
          { label: "Family", value: p.familyName },
          { label: "House", value: p.houseLocation },
        ]
          .filter((f) => hasText(f.value))
          .map((f) => (
            <p key={f.label} className="text-base text-ink-800">
              <span className="font-semibold uppercase tracking-wide text-heritage-700">
                {f.label}
              </span>{" "}
              — {f.value}
            </p>
          ))}
      </div>
      {hasText(p.notes) ? (
        <>
          <Divider className="my-4" />
          <p className="mx-auto max-w-lg text-center text-[15px] leading-7 text-ink-800">
            {p.notes}
          </p>
        </>
      ) : null}
      <SpouseBlock person={p} showPhoto={false} />
      {cell.children.length > 0 ? (
        <div className="mt-auto pt-4">
          <Divider className="mb-2" />
          <ChildrenDirectory children={cell.children} columns={2} onNavigate={onNavigate} />
        </div>
      ) : null}
    </div>
  );
}

/** Variant Gamma — index/sub-tree: parent header + multi-column child directory. */
function GammaLayout({
  cell,
  onNavigate,
}: {
  cell: FamilyCell;
  onNavigate: (pageIndex: number) => void;
}) {
  const p = cell.person;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4">
        {hasText(p.profileImageUrl) ? (
          <Photo
            url={p.profileImageUrl}
            alt={p.displayName}
            gallery={personGallery(p)}
            className="w-24 shrink-0"
            imgClassName="aspect-[3/4]"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <NameBanner
            name={p.displayName}
            original={p.originalName}
            code={p.genealogyCode}
            className="text-left"
          />
          <div className="mt-1 space-y-0.5">
            <InfoRow label="Place" value={p.place} />
            <InfoRow label="House" value={p.houseLocation} />
            {hasText(p.spouseName) ? (
              <InfoRow label="Spouse" value={p.spouseName} />
            ) : null}
          </div>
        </div>
      </div>
      <Divider className="my-3" />
      <div className="heritage-scroll flex-1 overflow-y-auto">
        <ChildrenDirectory children={cell.children} columns={3} onNavigate={onNavigate} />
      </div>
      <p className="mt-2 text-center text-[11px] italic text-ink-700">
        {cell.children.length} descendants in this branch
      </p>
    </div>
  );
}

export function FamilyCellPage({
  cell,
  onNavigate,
}: {
  cell: FamilyCell;
  onNavigate: (pageIndex: number) => void;
}) {
  return (
    <div className="heritage-scroll h-full overflow-y-auto px-1">
      {cell.variant === "alpha" ? (
        <AlphaLayout cell={cell} onNavigate={onNavigate} />
      ) : cell.variant === "gamma" ? (
        <GammaLayout cell={cell} onNavigate={onNavigate} />
      ) : (
        <BetaLayout cell={cell} onNavigate={onNavigate} />
      )}
    </div>
  );
}
