"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchEntry } from "@/types/chronicle";

export function SearchOverlay({
  open,
  entries,
  onClose,
  onNavigate,
}: {
  open: boolean;
  entries: SearchEntry[];
  onClose: () => void;
  onNavigate: (pageIndex: number) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      // focus after paint
      const id = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return entries
      .filter((e) => {
        return (
          e.displayName.toLowerCase().includes(q) ||
          e.genealogyCode.toLowerCase().includes(q) ||
          (e.originalName ?? "").toLowerCase().includes(q) ||
          (e.spouseName ?? "").toLowerCase().includes(q)
        );
      })
      .slice(0, 40);
  }, [query, entries]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink-900/60 p-4 pt-[12vh] backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="parchment page-border w-full max-w-lg rounded-lg p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-heritage-700">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or notation (e.g. A4.1)…"
            className="w-full bg-transparent text-lg text-ink-900 outline-none placeholder:text-ink-700/60"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 text-sm text-heritage-700 hover:bg-parchment-200"
          >
            Esc
          </button>
        </div>

        {query.trim() ? (
          <ul className="heritage-scroll mt-3 max-h-[50vh] space-y-0.5 overflow-y-auto border-t border-heritage-700/20 pt-2">
            {results.length === 0 ? (
              <li className="py-6 text-center text-sm italic text-ink-700">
                No matches for “{query}”.
              </li>
            ) : (
              results.map((r) => (
                <li key={r.genealogyCode}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(r.pageIndex);
                      onClose();
                    }}
                    className="flex w-full items-baseline gap-2 rounded px-2 py-1 text-left hover:bg-parchment-200/70"
                  >
                    <span className="w-16 shrink-0 text-[11px] font-semibold text-heritage-600">
                      {r.genealogyCode}
                    </span>
                    <span className="text-sm text-ink-900">
                      {r.displayName}
                      {r.originalName && r.originalName.trim() ? (
                        <span className="malayalam ml-1 text-xs text-heritage-700">
                          {r.originalName}
                        </span>
                      ) : null}
                      {r.spouseName && r.spouseName.trim() ? (
                        <span className="ml-1 text-xs italic text-ink-700">
                          & {r.spouseName}
                        </span>
                      ) : null}
                    </span>
                    <span className="ml-auto shrink-0 text-xs tabular-nums text-ink-700">
                      p.{r.pageIndex + 1}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : (
          <p className="mt-3 border-t border-heritage-700/20 pt-3 text-center text-sm italic text-ink-700">
            Type a name or a genealogy code to jump to that page.
          </p>
        )}
      </div>
    </div>
  );
}
