"use client";

import { useCallback, useEffect } from "react";
import { resolveImageUrl } from "@/lib/image";
import type { LightboxImage } from "./LightboxContext";

export function Lightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: LightboxImage[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const count = images.length;

  const prev = useCallback(() => {
    onIndexChange((index - 1 + count) % count);
  }, [index, count, onIndexChange]);

  const next = useCallback(() => {
    onIndexChange((index + 1) % count);
  }, [index, count, onIndexChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  if (count === 0) return null;
  const current = images[index];
  const src = resolveImageUrl(current.url);
  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/85 p-4 animate-fade-in"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
        aria-label="Close"
      >
        ×
      </button>

      {count > 1 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white hover:bg-white/20"
          aria-label="Previous"
        >
          ‹
        </button>
      ) : null}

      <figure className="max-h-[85vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={current.caption ?? "Family photograph"}
          className="max-h-[80vh] max-w-[90vw] rounded object-contain shadow-2xl"
        />
        <figcaption className="mt-2 text-center text-sm text-parchment-100">
          {current.caption ? <span>{current.caption}</span> : null}
          {count > 1 ? (
            <span className="ml-2 text-parchment-300">
              {index + 1} / {count}
            </span>
          ) : null}
        </figcaption>
      </figure>

      {count > 1 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white hover:bg-white/20"
          aria-label="Next"
        >
          ›
        </button>
      ) : null}
    </div>
  );
}
