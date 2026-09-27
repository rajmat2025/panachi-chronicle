"use client";

import { useEffect, useState } from "react";
import type {
  BookLayout,
  BookPage,
  ChronicleData,
  FlowBlock,
  NavTarget,
  PartStarts,
} from "@/types/chronicle";
import { createMeasureBox, paginateFlow, waitForFonts } from "./paginate";

const MALAYALAM = /[\u0D00-\u0D7F]/;

export function resolveTarget(starts: PartStarts, target: NavTarget): number {
  return starts[target.part] + target.offset;
}

function buildIndexBlocks(data: ChronicleData): FlowBlock[] {
  const blocks: FlowBlock[] = [
    {
      kind: "toc-title",
      id: "ix-title",
      text: "Family Index",
      subtitle: "Every family member in book order, grouped by branch and indented by generation.",
    },
  ];
  for (const group of data.tocGroups) {
    blocks.push({ kind: "toc-group", id: `ix-g-${group.key}`, text: group.label });
    for (const entry of group.entries) {
      blocks.push({
        kind: "toc-row",
        id: `ix-${entry.genealogyCode}`,
        code: entry.genealogyCode,
        text: entry.displayName,
        depth: entry.depth,
        target: { part: "cells", offset: entry.cellIndex },
      });
    }
  }
  return blocks;
}

function buildContentsBlocks(
  history: FlowBlock[],
  historyPages: FlowBlock[][],
  data: ChronicleData
): FlowBlock[] {
  const pageOfBlock = new Map<string, number>();
  historyPages.forEach((page, i) => {
    for (const block of page) if (!pageOfBlock.has(block.id)) pageOfBlock.set(block.id, i);
  });

  const blocks: FlowBlock[] = [{ kind: "toc-title", id: "ct-title", text: "Contents" }];

  for (const block of history) {
    if (block.kind === "part") {
      blocks.push({
        kind: "toc-group",
        id: `ct-${block.id}`,
        text: block.text,
        ml: MALAYALAM.test(block.text),
      });
    } else if (block.kind === "section") {
      blocks.push({
        kind: "toc-row",
        id: `ct-${block.id}`,
        text: block.text,
        depth: 0,
        ml: MALAYALAM.test(block.text),
        target: { part: "history", offset: pageOfBlock.get(block.id) ?? 0 },
      });
    }
  }

  blocks.push({ kind: "toc-group", id: "ct-records", text: "Family Records" });
  blocks.push({
    kind: "toc-row",
    id: "ct-index",
    text: "Family Index",
    depth: 0,
    target: { part: "index", offset: 0 },
  });
  for (const group of data.tocGroups) {
    if (group.entries.length === 0) continue;
    blocks.push({
      kind: "toc-row",
      id: `ct-g-${group.key}`,
      text: group.label,
      depth: 0,
      target: { part: "cells", offset: group.entries[0].cellIndex },
    });
  }
  return blocks;
}

/**
 * Paginate the flowing sections against the fixed letter-size content box and
 * assemble the full page list. Runs once on the client after fonts load; the
 * result does not depend on the viewport because pages have a fixed size.
 */
export function useBookLayout(data: ChronicleData, history: FlowBlock[]): BookLayout | null {
  const [layout, setLayout] = useState<BookLayout | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { box, dispose } = createMeasureBox();

    (async () => {
      await waitForFonts(box);
      if (cancelled) return;

      const historyPages = paginateFlow(history, box);
      const indexPages = paginateFlow(buildIndexBlocks(data), box);
      const contentsPages = paginateFlow(buildContentsBlocks(history, historyPages, data), box);

      const pages: BookPage[] = [{ kind: "cover" }];
      const starts: PartStarts = { contents: 0, history: 0, index: 0, cells: 0 };

      starts.contents = pages.length;
      for (const blocks of contentsPages) pages.push({ kind: "flow", part: "contents", blocks });
      starts.history = pages.length;
      for (const blocks of historyPages) pages.push({ kind: "flow", part: "history", blocks });
      starts.index = pages.length;
      for (const blocks of indexPages) pages.push({ kind: "flow", part: "index", blocks });
      starts.cells = pages.length;
      data.cells.forEach((_, cellIndex) => pages.push({ kind: "cell", cellIndex }));

      if (pages.length % 2 !== 0) pages.push({ kind: "back" });

      if (!cancelled) setLayout({ pages, starts });
    })().finally(dispose);

    return () => {
      cancelled = true;
    };
  }, [data, history]);

  return layout;
}
