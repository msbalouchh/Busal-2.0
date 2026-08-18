"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { ResolvedPlatformBranding } from "@/modules/platform/types/platform-config.types";

interface PlatformBrandingContextValue {
  branding: ResolvedPlatformBranding;
}

const PlatformBrandingContext = createContext<PlatformBrandingContextValue | null>(null);

interface PlatformBrandingProviderProps {
  branding: ResolvedPlatformBranding;
  children: ReactNode;
}

export function PlatformBrandingProvider({ branding, children }: PlatformBrandingProviderProps) {
  return (
    <PlatformBrandingContext.Provider value={{ branding }}>
      {children}
    </PlatformBrandingContext.Provider>
  );
}

export function usePlatformBranding(): PlatformBrandingContextValue {
  const context = useContext(PlatformBrandingContext);
  if (!context) {
    throw new Error("usePlatformBranding must be used within PlatformBrandingProvider");
  }
  return context;
}

export function useOptionalPlatformBranding(): PlatformBrandingContextValue | null {
  return useContext(PlatformBrandingContext);
}
