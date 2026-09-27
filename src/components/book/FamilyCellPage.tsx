"use client";

import clsx from "clsx";
import type { ChildRef, ChroniclePerson, FamilyCell } from "@/types/chronicle";
import { hasText, lifespan } from "@/lib/format";
import { resolveImageUrl } from "@/lib/image";
import type { LightboxImage } from "./LightboxContext";
import { Divider, InfoRow, Photo } from "./ui";

interface CellProps {
  cell: FamilyCell;
  /** Navigate to another family cell. */
  onNavigate: (cellIndex: number) => void;
  /** Printed page number of a family cell. */
  pageOfCell: (cellIndex: number) => number;
}

function dedupe(imgs: LightboxImage[]): LightboxImage[] {
  const seen = new Set<string>();
  return imgs.filter((i) => {
    const key = resolveImageUrl(i.url) ?? i.url;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function personGallery(p: ChroniclePerson): LightboxImage[] {
  const imgs: LightboxImage[] = [];
  if (hasText(p.profileImageUrl)) imgs.push({ url: p.profileImageUrl!, caption: p.displayName });
  for (const m of p.media) {
    if (m.subject !== "SPOUSE") imgs.push({ url: m.url, caption: m.caption });
  }
  return dedupe(imgs);
}

function spouseGallery(p: ChroniclePerson): LightboxImage[] {
  const imgs: LightboxImage[] = [];
  if (hasText(p.spouseProfileImageUrl))
    imgs.push({ url: p.spouseProfileImageUrl!, caption: p.spouseName });
  for (const m of p.media) {
    if (m.subject === "SPOUSE") imgs.push({ url: m.url, caption: m.caption });
  }
  return dedupe(imgs);
}

function CellHeader({ person, nameClass }: { person: ChroniclePerson; nameClass?: string }) {
  const span = lifespan(person.dob, person.dod);
  return (
    <header className="fc-header">
      <span className="fc-chip">{person.genealogyCode}</span>
      <h2 className={clsx("fc-name", nameClass)}>{person.displayName}</h2>
      {span ? <p className="fc-life">{span}</p> : null}
    </header>
  );
}

function ChildrenDirectory({
  children,
  columns,
  onNavigate,
  pageOfCell,
}: {
  children: ChildRef[];
  columns: 2 | 3;
  onNavigate: (cellIndex: number) => void;
  pageOfCell: (cellIndex: number) => number;
}) {
  if (children.length === 0) return null;
  // Inline entries carry details, which need the wider two-column layout.
  const cols = children.some((c) => c.inline) ? 2 : columns;
  return (
    <section className="fc-children">
      <p className="fc-label">Children</p>
      <ul className={clsx("fc-kids", cols === 3 ? "fc-kids-3" : "fc-kids-2")}>
        {children.map((c) => (
          <li key={c.genealogyCode}>
            {c.inline ? (
              <InlineChild person={c.inline} />
            ) : (
              <button type="button" onClick={() => onNavigate(c.cellIndex)} className="fc-kid">
                <span className="fc-kid-code">{c.genealogyCode}</span>
                <span className="fc-kid-name">{c.displayName}</span>
                <span className="fc-kid-page">p. {pageOfCell(c.cellIndex) + 1}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A child with no spouse and no children, shown in full on the parent's page. */
function InlineChild({ person }: { person: ChroniclePerson }) {
  const span = lifespan(person.dob, person.dod);
  const details = [person.otherName, person.place, person.qualification, person.houseLocation]
    .filter(hasText)
    .join(" · ");
  return (
    <div className="fc-kid fc-kid-inline">
      <span className="fc-kid-code">{person.genealogyCode}</span>
      {hasText(person.profileImageUrl) ? (
        <Photo
          url={person.profileImageUrl}
          alt={person.displayName}
          gallery={personGallery(person)}
          className="fc-photo-xs"
        />
      ) : null}
      <div className="fc-kid-body">
        <p className="fc-kid-name-full">{person.displayName}</p>
        {span ? <p className="fc-kid-detail">{span}</p> : null}
        {details ? <p className="fc-kid-detail">{details}</p> : null}
        {hasText(person.notes) ? <p className="fc-kid-note">{person.notes}</p> : null}
      </div>
    </div>
  );
}

function SpouseBlock({ person, showPhoto }: { person: ChroniclePerson; showPhoto: boolean }) {
  if (!hasText(person.spouseName)) return null;
  const span = lifespan(person.spouseDob, person.spouseDod);
  return (
    <section className="fc-spouse">
      <p className="fc-label">Spouse</p>
      <div className="fc-spouse-body">
        {showPhoto && hasText(person.spouseProfileImageUrl) ? (
          <Photo
            url={person.spouseProfileImageUrl}
            alt={person.spouseName ?? "Spouse"}
            gallery={spouseGallery(person)}
            className="fc-photo-sm"
          />
        ) : null}
        <div className="fc-spouse-text">
          <p className="fc-spouse-name">{person.spouseName}</p>
          {hasText(person.originalSpouseName) &&
          person.originalSpouseName!.trim() !== person.spouseName!.trim() ? (
            <p className="fc-spouse-orig ml">{person.originalSpouseName}</p>
          ) : null}
          <InfoRow label="Family" value={person.spouseFamilyName} />
          <InfoRow label="Place" value={person.spousePlace} />
          <InfoRow label="Qualification" value={person.spouseQualification} />
          {span ? <p className="fc-life">{span}</p> : null}
        </div>
      </div>
    </section>
  );
}

/** Variant Alpha — media-rich: framed photo + wrapped biography. */
function AlphaLayout({ cell, onNavigate, pageOfCell }: CellProps) {
  const p = cell.person;
  return (
    <div className="fc">
      <CellHeader person={p} />
      <Divider />
      <div className="fc-body">
        <Photo
          url={p.profileImageUrl}
          alt={p.displayName}
          gallery={personGallery(p)}
          className="fc-photo-lg fc-float"
        />
        <InfoRow label="Other name" value={p.otherName} />
        <InfoRow label="Family" value={p.familyName} />
        <InfoRow label="Place" value={p.place} />
        <InfoRow label="Qualification" value={p.qualification} />
        <InfoRow label="House" value={p.houseLocation} />
        {hasText(p.notes) ? <p className="fc-notes">{p.notes}</p> : null}
        <div className="clear-both" />
      </div>
      <SpouseBlock person={p} showPhoto />
      <ChildrenDirectory
        children={cell.children}
        columns={2}
        onNavigate={onNavigate}
        pageOfCell={pageOfCell}
      />
    </div>
  );
}

/** Variant Beta — text-centric: larger type, centered notes, dividers. */
function BetaLayout({ cell, onNavigate, pageOfCell }: CellProps) {
  const p = cell.person;
  const facts = [
    { label: "Place", value: p.place },
    { label: "Profession", value: p.qualification },
    { label: "Family", value: p.familyName },
    { label: "Other name", value: p.otherName },
    { label: "House", value: p.houseLocation },
  ].filter((f) => hasText(f.value));
  return (
    <div className="fc">
      <CellHeader person={p} nameClass="fc-name-xl" />
      <Divider />
      {facts.length > 0 ? (
        <div className="fc-facts">
          {facts.map((f) => (
            <p key={f.label}>
              <span className="fc-facts-label">{f.label}</span> {f.value}
            </p>
          ))}
        </div>
      ) : null}
      {hasText(p.notes) ? (
        <>
          <Divider />
          <p className="fc-notes-center">{p.notes}</p>
        </>
      ) : null}
      <SpouseBlock person={p} showPhoto={false} />
      <ChildrenDirectory
        children={cell.children}
        columns={2}
        onNavigate={onNavigate}
        pageOfCell={pageOfCell}
      />
    </div>
  );
}

/** Variant Gamma — index/sub-tree: parent header + multi-column child directory. */
function GammaLayout({ cell, onNavigate, pageOfCell }: CellProps) {
  const p = cell.person;
  return (
    <div className="fc">
      <div className="fc-gamma-head">
        {hasText(p.profileImageUrl) ? (
          <Photo
            url={p.profileImageUrl}
            alt={p.displayName}
            gallery={personGallery(p)}
            className="fc-photo-md"
          />
        ) : null}
        <div className="fc-gamma-text">
          <CellHeader person={p} nameClass="fc-name-left" />
          <InfoRow label="Place" value={p.place} />
          <InfoRow label="House" value={p.houseLocation} />
          <InfoRow label="Spouse" value={p.spouseName} />
        </div>
      </div>
      {hasText(p.notes) ? <p className="fc-notes">{p.notes}</p> : null}
      <Divider />
      <ChildrenDirectory
        children={cell.children}
        columns={3}
        onNavigate={onNavigate}
        pageOfCell={pageOfCell}
      />
      <p className="fc-footnote">{cell.children.length} children in this family</p>
    </div>
  );
}

export function FamilyCellPage(props: CellProps) {
  if (props.cell.variant === "alpha") return <AlphaLayout {...props} />;
  if (props.cell.variant === "gamma") return <GammaLayout {...props} />;
  return <BetaLayout {...props} />;
}
