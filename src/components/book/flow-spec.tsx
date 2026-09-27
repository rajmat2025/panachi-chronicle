import { createElement, type ReactNode } from "react";
import type { FlowBlock, NavTarget } from "@/types/chronicle";

/**
 * A tiny element tree describing a flow block. Rendering the same tree to React
 * (for pages) and to raw DOM (for the pagination measurer) guarantees that the
 * measured layout matches the rendered layout exactly.
 */
export interface VNode {
  tag: string;
  cls?: string;
  text?: string;
  children?: VNode[];
  nav?: NavTarget;
}

export type PageLabel = (target: NavTarget) => string;

const MAX_TOC_DEPTH = 6;

export function flowBlockSpec(block: FlowBlock, pageLabel: PageLabel): VNode {
  switch (block.kind) {
    case "part":
      return { tag: "h1", cls: "fb fb-part ml", text: block.text };
    case "section":
      return { tag: "h2", cls: "fb fb-section ml", text: block.text };
    case "subsection":
      return { tag: "h3", cls: "fb fb-subsection ml", text: block.text };
    case "minor":
      return { tag: "h4", cls: "fb fb-minor ml", text: block.text };
    case "subtitle":
      return { tag: "p", cls: "fb fb-subtitle ml", text: block.text };
    case "para":
      return {
        tag: "p",
        cls:
          "fb fb-para ml" +
          (block.continued ? " is-continued" : "") +
          (block.continues ? " is-continuing" : ""),
        text: block.text,
      };
    case "note":
      return {
        tag: "div",
        cls: "fb fb-note ml",
        children: block.lines.map((line) => ({ tag: "p", text: line })),
      };
    case "list":
      return {
        tag: "ul",
        cls: "fb fb-list ml",
        children: block.items.map((item) => ({ tag: "li", text: item })),
      };
    case "table":
      return {
        tag: "table",
        cls: "fb fb-table ml",
        children: [
          {
            tag: "thead",
            children: [
              { tag: "tr", children: block.header.map((h) => ({ tag: "th", text: h })) },
            ],
          },
          {
            tag: "tbody",
            children: block.rows.map((row) => ({
              tag: "tr",
              children: row.map((cell) => ({ tag: "td", text: cell })),
            })),
          },
        ],
      };
    case "toc-title":
      return {
        tag: "div",
        cls: "fb toc-title",
        children: [
          { tag: "h2", cls: "toc-title-text", text: block.text },
          ...(block.subtitle ? [{ tag: "p", cls: "toc-subtitle", text: block.subtitle }] : []),
        ],
      };
    case "toc-group":
      return { tag: "h3", cls: "fb toc-group" + (block.ml ? " ml" : ""), text: block.text };
    case "toc-row":
      return {
        tag: "div",
        cls: `fb toc-row toc-d${Math.min(block.depth, MAX_TOC_DEPTH)}${block.ml ? " ml" : ""}`,
        nav: block.target,
        children: [
          ...(block.code ? [{ tag: "span", cls: "toc-code", text: block.code }] : []),
          { tag: "span", cls: "toc-name", text: block.text },
          { tag: "span", cls: "toc-leader" },
          { tag: "span", cls: "toc-page", text: pageLabel(block.target) },
        ],
      };
  }
}

export function renderVNode(
  node: VNode,
  key: string | number,
  onNavigate?: (target: NavTarget) => void
): ReactNode {
  const children = node.children
    ? node.children.map((child, i) => renderVNode(child, i, onNavigate))
    : node.text;
  const props: Record<string, unknown> = { key, className: node.cls };
  if (node.nav && onNavigate) {
    const target = node.nav;
    props.role = "link";
    props.tabIndex = 0;
    props.onClick = () => onNavigate(target);
    props.onKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") onNavigate(target);
    };
  }
  return createElement(node.tag, props, children);
}

export function vnodeToDom(node: VNode): HTMLElement {
  const el = document.createElement(node.tag);
  if (node.cls) el.className = node.cls;
  if (node.children) {
    for (const child of node.children) el.appendChild(vnodeToDom(child));
  } else if (node.text !== undefined) {
    el.textContent = node.text;
  }
  return el;
}
