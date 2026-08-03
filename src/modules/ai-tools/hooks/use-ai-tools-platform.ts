"use client";

import { useContext } from "react";

import { AiToolsPlatformContext } from "@/modules/ai-tools/contexts/platform-context";
import type { AiToolsPlatformContextValue } from "@/modules/ai-tools/types";

export function useAiToolsPlatformContext(): AiToolsPlatformContextValue {
  const context = useContext(AiToolsPlatformContext);

  if (!context) {
    throw new Error("useAiToolsPlatformContext must be used within AiToolsPlatformProvider");
  }

  return context;
}

export function useAiToolsPlatform(): AiToolsPlatformContextValue {
  return useAiToolsPlatformContext();
}
