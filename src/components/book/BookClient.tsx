"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import HTMLFlipBookBase from "react-pageflip";
import type { BookLayout, ChronicleData, FlowBlock } from "@/types/chronicle";
import { BookPageView } from "./BookPages";
import { GenerationRibbon } from "./GenerationRibbon";
import { SearchOverlay } from "./SearchOverlay";
import { Lightbox } from "./Lightbox";
import { LightboxProvider, type LightboxImage } from "./LightboxContext";
import { RenderModeProvider } from "./RenderMode";
import { useBookLayout } from "./use-book-layout";

// The bundled typings mark every option as required; the library supplies defaults.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HTMLFlipBook = HTMLFlipBookBase as unknown as React.ComponentType<any>;

/** Letter size at 96 px per inch. */
const PAGE_W = 816;
const PAGE_H = 1056;
const CHROME_H = 104;

interface Dims {
  width: number;
  height: number;
  scale: number;
}

function computeDims(): Dims {
  const availH = window.innerHeight - CHROME_H;
  const availW = window.innerWidth - 56;
  const portrait = window.innerWidth < 900;
  let scale = Math.min(1, availH / PAGE_H);
  const spreadW = PAGE_W * scale * (portrait ? 1 : 2);
  if (spreadW > availW) scale *= availW / spreadW;
  scale = Math.max(0.25, scale);
  return {
    width: Math.floor(PAGE_W * scale),
    height: Math.floor(PAGE_H * scale),
    scale,
  };
}

/** A single flipbook page. react-pageflip requires a forwarded DOM ref. */
const PageShell = forwardRef<
  HTMLDivElement,
  { scale: number; hard?: boolean; children: React.ReactNode }
>(function PageShell({ scale, hard, children }, ref) {
  return (
    <div className="book-page" ref={ref} data-density={hard ? "hard" : "soft"}>
      <div className="letter-scaler" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
});

function ToolbarButton({
  onClick,
  children,
  className = "",
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border border-parchment-100/40 px-3 py-1 text-[11px] uppercase tracking-widest hover:bg-parchment-100/10 ${className}`}
    >
      {children}
    </button>
  );
}

export function BookClient({ data, history }: { data: ChronicleData; history: FlowBlock[] }) {
  const layout = useBookLayout(data, history);

  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(
    null
  );
  const openLightbox = useCallback((images: LightboxImage[], startIndex = 0) => {
    if (images.length > 0) setLightbox({ images, index: startIndex });
  }, []);

  return (
    <LightboxProvider value={openLightbox}>
      {layout ? (
        <>
          <ScreenBook data={data} layout={layout} keysDisabled={lightbox !== null} />
          <PrintBook data={data} layout={layout} />
        </>
      ) : (
        <div className="screen-only flex min-h-dvh items-center justify-center">
          <p className="animate-pulse text-sm italic text-parchment-100">
            Setting the pages of the chronicle…
          </p>
        </div>
      )}

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

function ScreenBook({
  data,
  layout,
  keysDisabled,
}: {
  data: ChronicleData;
  layout: BookLayout;
  keysDisabled: boolean;
}) {
  const bookRef = useRef<any>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<Dims | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const currentPageRef = useRef(0);
  const [searchOpen, setSearchOpen] = useState(false);

  useLayoutEffect(() => {
    setDims(computeDims());
    let timer: number | undefined;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setDims(computeDims()), 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const navigate = useCallback((pageIndex: number) => {
    bookRef.current?.pageFlip?.()?.flip(pageIndex, "top");
  }, []);
  const flipPrev = useCallback(() => bookRef.current?.pageFlip?.()?.flipPrev("top"), []);
  const flipNext = useCallback(() => bookRef.current?.pageFlip?.()?.flipNext("top"), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (searchOpen || keysDisabled) return;
      if (e.key === "ArrowLeft") flipPrev();
      else if (e.key === "ArrowRight") flipNext();
      else if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipPrev, flipNext, searchOpen, keysDisabled]);

  // Two-finger pinch is the browser's zoom. Stop the page-flip library from
  // treating those touches as a page turn.
  useEffect(() => {
    const root = stageRef.current;
    if (!root) return;
    const ignoreFlip = (e: TouchEvent) => {
      if (e.touches.length >= 2) e.stopPropagation();
    };
    root.addEventListener("touchstart", ignoreFlip, { capture: true });
    root.addEventListener("touchmove", ignoreFlip, { capture: true });
    return () => {
      root.removeEventListener("touchstart", ignoreFlip, { capture: true });
      root.removeEventListener("touchmove", ignoreFlip, { capture: true });
    };
  }, []);

  const pageOfCell = useCallback(
    (cellIndex: number) => layout.starts.cells + cellIndex,
    [layout.starts.cells]
  );
  const goToCell = useCallback((cellIndex: number) => navigate(pageOfCell(cellIndex)), [
    navigate,
    pageOfCell,
  ]);

  // react-pageflip rebuilds its pages whenever `children` changes identity, and a
  // rebuild during a flip animation snaps back to the previous page. Keep the
  // page elements stable across unrelated re-renders (search, ribbon, footer).
  const scale = dims?.scale ?? 1;
  const pageElements = useMemo(
    () =>
      layout.pages.map((page, i) => (
        <PageShell key={i} scale={scale} hard={page.kind === "cover" || page.kind === "back"}>
          <BookPageView page={page} index={i} layout={layout} data={data} onNavigate={navigate} />
        </PageShell>
      )),
    [layout, data, scale, navigate]
  );
  const onFlip = useCallback((e: { data: number }) => {
    currentPageRef.current = e.data;
    setCurrentPage(e.data);
  }, []);

  const current = layout.pages[currentPage];
  const activeGeneration =
    current?.kind === "cell" ? data.cells[current.cellIndex].person.generationNumber : null;
  const totalPages = layout.pages.length;

  return (
    <div className="screen-only flex min-h-dvh flex-col">
      <header className="z-30 flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-parchment-100">
        <span className="font-serif text-base font-semibold tracking-wide">
          Panachickal Chronicle
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <ToolbarButton onClick={() => navigate(layout.starts.contents)}>Contents</ToolbarButton>
          <ToolbarButton onClick={() => navigate(layout.starts.history)}>History</ToolbarButton>
          <ToolbarButton onClick={() => navigate(layout.starts.index)} className="hidden sm:block">
            Index
          </ToolbarButton>
          <ToolbarButton onClick={() => navigate(layout.starts.cells)}>Families</ToolbarButton>
          <ToolbarButton onClick={() => setSearchOpen(true)}>Search</ToolbarButton>
          <ToolbarButton onClick={() => window.print()}>Print</ToolbarButton>
        </div>
      </header>

      <div ref={stageRef} className="relative flex flex-1 items-center justify-center overflow-auto px-2">
        <div className="pointer-events-none absolute right-2 top-1/2 z-20 -translate-y-1/2">
          <GenerationRibbon
            generations={data.generations}
            activeGeneration={activeGeneration}
            onNavigate={goToCell}
            pageOfCell={pageOfCell}
          />
        </div>

        {dims ? (
          <HTMLFlipBook
            key={`${dims.width}x${dims.height}`}
            ref={bookRef}
            width={dims.width}
            height={dims.height}
            size="fixed"
            minWidth={200}
            maxWidth={PAGE_W}
            minHeight={260}
            maxHeight={PAGE_H}
            maxShadowOpacity={0.4}
            showCover
            mobileScrollSupport
            flippingTime={650}
            usePortrait
            drawShadow
            className="chronicle-book"
            startPage={currentPageRef.current}
            renderOnlyPageLengthChange
            onFlip={onFlip}
          >
            {pageElements}
          </HTMLFlipBook>
        ) : null}
      </div>

      <footer className="z-30 flex items-center justify-center gap-4 px-4 py-1.5 text-parchment-100">
        <button
          type="button"
          onClick={flipPrev}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-parchment-100/40 text-lg hover:bg-parchment-100/10"
          aria-label="Previous page"
        >
          ‹
        </button>
        <span className="min-w-24 text-center text-[11px] uppercase tracking-widest text-parchment-200">
          Page {currentPage + 1} / {totalPages}
        </span>
        <button
          type="button"
          onClick={flipNext}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-parchment-100/40 text-lg hover:bg-parchment-100/10"
          aria-label="Next page"
        >
          ›
        </button>
      </footer>

      <SearchOverlay
        open={searchOpen}
        entries={data.searchIndex}
        onClose={() => setSearchOpen(false)}
        onNavigate={goToCell}
        pageOfCell={pageOfCell}
      />
    </div>
  );
}

/** Every page at full letter size, shown only when printing. */
function PrintBook({ data, layout }: { data: ChronicleData; layout: BookLayout }) {
  const noop = useCallback(() => undefined, []);
  return (
    <RenderModeProvider value="print">
      <div className="print-book" aria-hidden>
        {layout.pages.map((page, i) => (
          <div className="print-sheet" key={i}>
            <BookPageView page={page} index={i} layout={layout} data={data} onNavigate={noop} />
          </div>
        ))}
      </div>
    </RenderModeProvider>
  );
}
