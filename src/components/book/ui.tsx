"use client";

import { useState } from "react";
import clsx from "clsx";
import { resolveImageUrl } from "@/lib/image";
import { useLightbox, type LightboxImage } from "./LightboxContext";
import { useRenderMode } from "./RenderMode";

/** Decorative SVG divider used between sections. */
export function Divider({ className }: { className?: string }) {
  return (
    <div className={clsx("fc-divider", className)} aria-hidden>
      <span className="fc-divider-line" />
      <svg width="26" height="14" viewBox="0 0 26 14" fill="none">
        <path
          d="M1 7h7l2-4 3 8 3-8 2 4h7"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="13" cy="7" r="1.6" fill="currentColor" />
      </svg>
      <span className="fc-divider-line" />
    </div>
  );
}

/** A framed, clickable photograph that opens the lightbox. */
export function Photo({
  url,
  alt,
  gallery,
  className,
}: {
  url: string | null | undefined;
  alt: string;
  /** Optional additional images to browse in the lightbox. */
  gallery?: LightboxImage[];
  className?: string;
}) {
  const openLightbox = useLightbox();
  const mode = useRenderMode();
  // A photo recorded in the database may be missing on the tree site; drop the frame.
  const [failed, setFailed] = useState(false);
  const resolved = resolveImageUrl(url);
  if (!resolved || failed) return null;

  const images: LightboxImage[] = gallery && gallery.length > 0 ? gallery : [{ url: resolved }];
  const startIndex = Math.max(
    0,
    images.findIndex((g) => resolveImageUrl(g.url) === resolved)
  );

  return (
    <figure className={clsx("vintage-frame", className)}>
      <button
        type="button"
        onClick={() => openLightbox(images, startIndex)}
        className="block w-full cursor-zoom-in"
        aria-label={`View photo of ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolved}
          alt={alt}
          loading={mode === "print" ? "eager" : "lazy"}
          onError={() => setFailed(true)}
          className="block aspect-[3/4] w-full object-cover"
        />
      </button>
    </figure>
  );
}

/** A labelled detail line, hidden entirely when the value is empty. */
export function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || !value.trim()) return null;
  return (
    <div className="fc-row">
      <span className="fc-row-label">{label}</span>
      <span className="fc-row-value">{value}</span>
    </div>
  );
}
