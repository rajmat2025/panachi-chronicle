"use client";

import clsx from "clsx";
import type { GenerationMarker } from "@/types/chronicle";

export function GenerationRibbon({
  generations,
  currentPage,
  onNavigate,
}: {
  generations: GenerationMarker[];
  currentPage: number;
  onNavigate: (pageIndex: number) => void;
}) {
  if (generations.length === 0) return null;

  // Determine active generation = last marker whose page <= currentPage.
  let activeGen = generations[0].generationNumber;
  for (const g of generations) {
    if (g.pageIndex <= currentPage) activeGen = g.generationNumber;
  }

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-1 rounded-full bg-ink-900/70 px-2 py-3 backdrop-blur">
      <span className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-parchment-200">
        Gen
      </span>
      {generations.map((g) => {
        const active = g.generationNumber === activeGen;
        return (
          <button
            key={g.generationNumber}
            type="button"
            title={`${g.label} — jump to page ${g.pageIndex + 1}`}
            onClick={() => onNavigate(g.pageIndex)}
            className={clsx(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition",
              active
                ? "scale-110 bg-gold-400 text-ink-900 shadow"
                : "bg-parchment-100/20 text-parchment-100 hover:bg-parchment-100/40"
            )}
          >
            {g.generationNumber}
          </button>
        );
      })}
    </div>
  );
}
