"use client";

import { createContext, useContext } from "react";

export interface LightboxImage {
  url: string;
  caption?: string | null;
}

type OpenLightbox = (images: LightboxImage[], startIndex?: number) => void;

const LightboxContext = createContext<OpenLightbox>(() => {});

export const LightboxProvider = LightboxContext.Provider;

export function useLightbox(): OpenLightbox {
  return useContext(LightboxContext);
}
