"use client";

import type { TocEntry } from "@/types/chronicle";
import { Divider } from "./ui";

export function CoverPage({ totalPeople }: { totalPeople: number }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.4em] text-heritage-700">
        The
      </p>
      <h1 className="mt-2 font-serif text-4xl font-bold leading-tight text-ink-900 md:text-5xl">
        Panachickal
      </h1>
      <p className="malayalam mt-1 text-2xl text-heritage-700">പനച്ചിക്കൽ</p>
      <p className="mt-3 text-lg uppercase tracking-[0.3em] text-ink-800">
        Family Chronicle
      </p>
      <Divider className="my-6" />
      <p className="max-w-xs text-sm italic leading-relaxed text-ink-700">
        A page-turning record of generations — their names, their homes, and the
        stories carried down the branches of one family.
      </p>
      <div className="mt-8 rounded-full border border-heritage-700/40 px-4 py-1 text-xs uppercase tracking-widest text-heritage-700">
        {totalPeople} family members
      </div>
    </div>
  );
}

export function TocPage({
  entries,
  pageNumber,
  totalTocPages,
  onNavigate,
}: {
  entries: TocEntry[];
  pageNumber: number;
  totalTocPages: number;
  onNavigate: (pageIndex: number) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {pageNumber === 1 ? (
        <>
          <h2 className="text-center font-serif text-2xl font-semibold text-ink-900">
            Table of Contents
          </h2>
          <Divider className="mb-2 mt-1" />
        </>
      ) : (
        <p className="mb-2 text-center text-xs uppercase tracking-widest text-heritage-700">
          Contents (continued)
        </p>
      )}
      <ul className="heritage-scroll flex-1 space-y-0.5 overflow-y-auto pr-1">
        {entries.map((e) => (
          <li key={e.genealogyCode}>
            <button
              type="button"
              onClick={() => onNavigate(e.pageIndex)}
              className="group flex w-full items-baseline gap-2 py-0.5 text-left"
            >
              <span className="w-14 shrink-0 text-[11px] font-semibold text-heritage-600">
                {e.genealogyCode}
              </span>
              <span className="truncate text-sm text-ink-900 group-hover:underline">
                {e.displayName}
                {e.originalName && e.originalName.trim() ? (
                  <span className="malayalam ml-1 text-xs text-heritage-700">
                    {e.originalName}
                  </span>
                ) : null}
              </span>
              <span className="ml-auto shrink-0 text-xs tabular-nums text-ink-700">
                {e.pageIndex + 1}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-center text-[11px] text-ink-700">
        Index page {pageNumber} of {totalTocPages}
      </p>
    </div>
  );
}
