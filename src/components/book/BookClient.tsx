"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- react-pageflip ships without bundled types
import HTMLFlipBook from "react-pageflip";
import type { ChronicleBook } from "@/types/chronicle";
import { CoverPage, TocPage } from "./FrontMatter";
import { FamilyCellPage } from "./FamilyCellPage";
import { GenerationRibbon } from "./GenerationRibbon";
import { SearchOverlay } from "./SearchOverlay";
import { Lightbox } from "./Lightbox";
import { LightboxProvider, type LightboxImage } from "./LightboxContext";

interface Dims {
  width: number;
  height: number;
}

/** A single physical page. react-pageflip requires a forwarded DOM ref. */
const PageShell = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  function PageShell({ children }, ref) {
    return (
      <div className="book-page parchment page-border" ref={ref}>
        <div className="h-full w-full p-5 md:p-7">{children}</div>
      </div>
    );
  }
);

function computeDims(): Dims {
  if (typeof window === "undefined") return { width: 460, height: 620 };
  const availH = window.innerHeight - 132;
  const availW = window.innerWidth - 32;
  const portrait = window.innerWidth < 820;

  let height = Math.min(availH, 900);
  let width = Math.round(height * 0.72);

  // In landscape we show two pages side by side; keep the spread on screen.
  const spread = portrait ? width : width * 2;
  if (spread > availW) {
    const scale = availW / spread;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  return { width: Math.max(280, width), height: Math.max(380, height) };
}

export function BookClient({ book }: { book: ChronicleBook }) {
  const bookRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [dims, setDims] = useState<Dims>({ width: 460, height: 620 });
  const [currentPage, setCurrentPage] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  const [lightbox, setLightbox] = useState<{
    images: LightboxImage[];
    index: number;
  } | null>(null);

  const openLightbox = useCallback((images: LightboxImage[], startIndex = 0) => {
    if (images.length > 0) setLightbox({ images, index: startIndex });
  }, []);

  useLayoutEffect(() => {
    setDims(computeDims());
    setMounted(true);
  }, []);

  useEffect(() => {
    const onResize = () => setDims(computeDims());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navigate = useCallback((pageIndex: number) => {
    const api = bookRef.current?.pageFlip?.();
    if (api) api.flip(pageIndex, "top");
  }, []);

  const flipPrev = useCallback(() => {
    bookRef.current?.pageFlip?.()?.flipPrev("top");
  }, []);
  const flipNext = useCallback(() => {
    bookRef.current?.pageFlip?.()?.flipNext("top");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (searchOpen || lightbox) return;
      if (e.key === "ArrowLeft") flipPrev();
      else if (e.key === "ArrowRight") flipNext();
      else if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipPrev, flipNext, searchOpen, lightbox]);

  const totalTocPages = book.pages.filter((p) => p.kind === "toc").length;
  const totalPages = book.pages.length;

  return (
    <LightboxProvider value={openLightbox}>
      <div className="flex min-h-dvh flex-col">
        {/* Top toolbar */}
        <header className="z-30 flex items-center justify-between gap-3 px-4 py-2 text-parchment-100">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-semibold tracking-wide">
              Panachickal Chronicle
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(book.firstCellPage)}
              className="hidden rounded-full border border-parchment-100/40 px-3 py-1 text-xs uppercase tracking-widest hover:bg-parchment-100/10 sm:block"
            >
              Start reading
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-parchment-100/40 px-3 py-1 text-xs uppercase tracking-widest hover:bg-parchment-100/10"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Search
            </button>
          </div>
        </header>

        {/* Book stage */}
        <div className="relative flex flex-1 items-center justify-center px-2 pb-4">
          {/* Generation ribbon */}
          <div className="pointer-events-none absolute right-2 top-1/2 z-20 -translate-y-1/2">
            <GenerationRibbon
              generations={book.generations}
              currentPage={currentPage}
              onNavigate={navigate}
            />
          </div>

          {mounted ? (
            <HTMLFlipBook
              ref={bookRef}
              width={dims.width}
              height={dims.height}
              size="fixed"
              minWidth={280}
              maxWidth={760}
              minHeight={380}
              maxHeight={1000}
              maxShadowOpacity={0.5}
              showCover
              mobileScrollSupport
              flippingTime={700}
              usePortrait
              drawShadow
              className="chronicle-book"
              startPage={0}
              onFlip={(e: { data: number }) => setCurrentPage(e.data)}
            >
              {book.pages.map((page) => {
                if (page.kind === "cover") {
                  return (
                    <PageShell key="cover">
                      <CoverPage totalPeople={book.totalPeople} />
                    </PageShell>
                  );
                }
                if (page.kind === "toc") {
                  const tocPageNumber =
                    book.pages
                      .filter((p) => p.kind === "toc")
                      .findIndex((p) => p.index === page.index) + 1;
                  return (
                    <PageShell key={`toc-${page.index}`}>
                      <TocPage
                        entries={page.tocEntries ?? []}
                        pageNumber={tocPageNumber}
                        totalTocPages={totalTocPages}
                        onNavigate={navigate}
                      />
                    </PageShell>
                  );
                }
                if (page.kind === "cell" && page.cell) {
                  return (
                    <PageShell key={page.cell.person.genealogyCode}>
                      <FamilyCellPage cell={page.cell} onNavigate={navigate} />
                      <span className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[10px] text-ink-700/70">
                        {page.index + 1}
                      </span>
                    </PageShell>
                  );
                }
                return (
                  <PageShell key={`back-${page.index}`}>
                    <div className="flex h-full items-center justify-center">
                      <p className="text-center text-sm italic text-ink-700">
                        Panachickal Family Chronicle
                      </p>
                    </div>
                  </PageShell>
                );
              })}
            </HTMLFlipBook>
          ) : (
            <div className="parchment page-border flex h-[620px] w-[460px] max-w-full items-center justify-center rounded">
              <p className="animate-pulse text-sm italic text-ink-700">
                Opening the chronicle…
              </p>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <footer className="z-30 flex items-center justify-center gap-4 px-4 py-2 text-parchment-100">
          <button
            type="button"
            onClick={flipPrev}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-parchment-100/40 text-xl hover:bg-parchment-100/10"
            aria-label="Previous page"
          >
            ‹
          </button>
          <span className="min-w-24 text-center text-xs uppercase tracking-widest text-parchment-200">
            Page {currentPage + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={flipNext}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-parchment-100/40 text-xl hover:bg-parchment-100/10"
            aria-label="Next page"
          >
            ›
          </button>
        </footer>
      </div>

      <SearchOverlay
        open={searchOpen}
        entries={book.searchIndex}
        onClose={() => setSearchOpen(false)}
        onNavigate={navigate}
      />

      {lightbox ? (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onIndexChange={(i) => setLightbox((s) => (s ? { ...s, index: i } : s))}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </LightboxProvider>
  );
}
