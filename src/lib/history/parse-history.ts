import type { FlowBlock } from "@/types/chronicle";

const HEADING_KINDS = ["part", "section", "subsection", "minor"] as const;

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

/**
 * Parse the family-history Markdown (see conventions at the top of
 * content/family-history.md) into flow blocks. One block per line.
 */
export function parseHistory(markdown: string): FlowBlock[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: FlowBlock[] = [];
  const nextId = () => `h${blocks.length}`;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    if (line.startsWith("<!--")) {
      while (i < lines.length && !lines[i].includes("-->")) i++;
      i++;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      blocks.push({
        kind: HEADING_KINDS[heading[1].length - 1],
        id: nextId(),
        text: heading[2].trim(),
      });
      i++;
      continue;
    }

    if (line.startsWith("^ ")) {
      blocks.push({ kind: "subtitle", id: nextId(), text: line.slice(2).trim() });
      i++;
      continue;
    }

    if (line.startsWith(">")) {
      const noteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        noteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ kind: "note", id: nextId(), lines: noteLines });
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2).trim());
        i++;
      }
      blocks.push({ kind: "list", id: nextId(), items });
      continue;
    }

    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const row = lines[i].trim();
        if (!/^\|[\s:|-]+\|$/.test(row)) rows.push(splitRow(row));
        i++;
      }
      const [header = [], ...body] = rows;
      blocks.push({ kind: "table", id: nextId(), header, rows: body });
      continue;
    }

    blocks.push({ kind: "para", id: nextId(), text: line });
    i++;
  }

  return blocks;
}
