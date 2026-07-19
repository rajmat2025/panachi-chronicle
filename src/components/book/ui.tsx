"use client";

import clsx from "clsx";
import { resolveImageUrl } from "@/lib/image";
import { useLightbox, type LightboxImage } from "./LightboxContext";

/** Decorative SVG divider used between sections. */
export function Divider({ className }: { className?: string }) {
  return (
    <div className={clsx("flex items-center justify-center gap-2 text-heritage-700", className)}>
      <span className="h-px w-10 bg-heritage-700/50" />
      <svg width="26" height="14" viewBox="0 0 26 14" fill="none" aria-hidden>
        <path
          d="M1 7h7l2-4 3 8 3-8 2 4h7"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="13" cy="7" r="1.6" fill="currentColor" />
      </svg>
      <span className="h-px w-10 bg-heritage-700/50" />
    </div>
  );
}

/** A framed, clickable photograph that opens the lightbox. */
export function Photo({
  url,
  alt,
  caption,
  gallery,
  className,
  imgClassName,
}: {
  url: string | null | undefined;
  alt: string;
  caption?: string | null;
  /** Optional additional images to browse in the lightbox. */
  gallery?: LightboxImage[];
  className?: string;
  imgClassName?: string;
}) {
  const openLightbox = useLightbox();
  const resolved = resolveImageUrl(url);
  if (!resolved) return null;

  const images: LightboxImage[] =
    gallery && gallery.length > 0
      ? gallery
      : [{ url: resolved, caption }];

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
          loading="lazy"
          className={clsx("block h-full w-full object-cover", imgClassName)}
        />
      </button>
      {caption ? (
        <figcaption className="mt-1 text-center text-[11px] italic text-ink-700">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Name callout banner: English name with Malayalam original beneath. */
export function NameBanner({
  name,
  original,
  code,
  size = "lg",
  className,
}: {
  name: string;
  original?: string | null;
  code?: string;
  size?: "lg" | "md" | "sm";
  className?: string;
}) {
  const nameSize =
    size === "lg" ? "text-2xl md:text-3xl" : size === "md" ? "text-xl" : "text-lg";
  return (
    <div className={clsx("text-center", className)}>
      {code ? (
        <div className="mb-1 inline-block rounded-full border border-heritage-700/40 bg-parchment-50/70 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-heritage-700">
          {code}
        </div>
      ) : null}
      <h2 className={clsx("font-semibold leading-tight text-ink-900", nameSize)}>
        {name}
      </h2>
      {original && original.trim() && original.trim() !== name.trim() ? (
        <p className="malayalam mt-0.5 text-lg text-heritage-700">{original}</p>
      ) : null}
    </div>
  );
}

/** A labelled detail line, hidden entirely when the value is empty. */
export function InfoRow({
  label,
  value,
  malayalam,
}: {
  label: string;
  value: string | null | undefined;
  malayalam?: boolean;
}) {
  if (!value || !value.trim()) return null;
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-sm leading-relaxed">
      <span className="font-semibold text-heritage-700">{label}:</span>
      <span className={clsx("text-ink-800", malayalam && "malayalam")}>{value}</span>
    </div>
  );
}
