"use client";

import clsx from "clsx";
import type { GenerationMarker } from "@/types/chronicle";

export function GenerationRibbon({
  generations,
  activeGeneration,
  onNavigate,
  pageOfCell,
}: {
  generations: GenerationMarker[];
  /** Generation of the family cell currently open, if any. */
  activeGeneration: number | null;
  onNavigate: (cellIndex: number) => void;
  pageOfCell: (cellIndex: number) => number;
}) {
  if (generations.length === 0) return null;

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-1 rounded-full bg-ink-900/70 px-1.5 py-2.5 backdrop-blur">
      <span className="mb-0.5 text-[8px] font-semibold uppercase tracking-widest text-parchment-200">
        Gen
      </span>
      {generations.map((g) => {
        const active = g.generationNumber === activeGeneration;
        return (
          <button
            key={g.generationNumber}
            type="button"
            title={`${g.label} — first family on page ${pageOfCell(g.cellIndex) + 1}`}
            onClick={() => onNavigate(g.cellIndex)}
            className={clsx(
              "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition",
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
