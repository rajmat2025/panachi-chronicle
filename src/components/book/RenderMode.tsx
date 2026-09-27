"use client";

import { createContext, useContext } from "react";

/** "print" pages load images eagerly so they are ready when the print dialog opens. */
export type RenderMode = "screen" | "print";

const RenderModeContext = createContext<RenderMode>("screen");

export const RenderModeProvider = RenderModeContext.Provider;

export function useRenderMode(): RenderMode {
  return useContext(RenderModeContext);
}
