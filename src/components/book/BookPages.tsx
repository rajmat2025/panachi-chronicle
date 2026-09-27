"use client";

import type { BookLayout, BookPage, ChronicleData, NavTarget } from "@/types/chronicle";
import { FamilyCellPage } from "./FamilyCellPage";
import { flowBlockSpec, renderVNode } from "./flow-spec";
import { BackPage, CoverPage } from "./FrontMatter";
import { resolveTarget } from "./use-book-layout";

const PART_HEADERS = {
  contents: "Contents",
  history: "Family History",
  index: "Family Index",
} as const;

function cellHeader(data: ChronicleData, cellIndex: number): string {
  const p = data.cells[cellIndex].person;
  const line = p.branchCode === "G6" ? "Ancestral Line" : `Branch ${p.branchCode}`;
  return `${line} · Generation ${p.generationNumber}`;
}

/** One letter-size page (8.5 × 11 in) at its natural 816 × 1056 px size. */
export function LetterPage({
  header,
  folio,
  children,
}: {
  header?: string;
  folio?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="letter-page parchment book-type">
      <div className="letter-frame" aria-hidden />
      {header ? <div className="letter-header">{header}</div> : null}
      <div className="letter-content flow">{children}</div>
      {folio !== undefined ? <div className="letter-folio">{folio}</div> : null}
    </div>
  );
}

export function BookPageView({
  page,
  index,
  layout,
  data,
  onNavigate,
}: {
  page: BookPage;
  index: number;
  layout: BookLayout;
  data: ChronicleData;
  /** Go to an absolute page index. */
  onNavigate: (pageIndex: number) => void;
}) {
  const pageOfCell = (cellIndex: number) => layout.starts.cells + cellIndex;

  if (page.kind === "cover") {
    return (
      <LetterPage>
        <CoverPage totalPeople={data.totalPeople} />
      </LetterPage>
    );
  }

  if (page.kind === "back") {
    return (
      <LetterPage>
        <BackPage />
      </LetterPage>
    );
  }

  if (page.kind === "cell") {
    return (
      <LetterPage header={cellHeader(data, page.cellIndex)} folio={index + 1}>
        <FamilyCellPage
          cell={data.cells[page.cellIndex]}
          onNavigate={(cellIndex) => onNavigate(pageOfCell(cellIndex))}
          pageOfCell={pageOfCell}
        />
      </LetterPage>
    );
  }

  const label = (t: NavTarget) => String(resolveTarget(layout.starts, t) + 1);
  const go = (t: NavTarget) => onNavigate(resolveTarget(layout.starts, t));
  return (
    <LetterPage header={PART_HEADERS[page.part]} folio={index + 1}>
      {page.blocks.map((block) => renderVNode(flowBlockSpec(block, label), block.id, go))}
    </LetterPage>
  );
}
