"use client";

import { useContext } from "react";

import { AiContext } from "@/modules/ai/contexts/ai-context";
import type { AiContextValue } from "@/modules/ai/types/context";

export function useAiContext(): AiContextValue {
  const context = useContext(AiContext);

  if (!context) {
    throw new Error("useAiContext must be used within AIContextProvider");
  }

  return context;
}

export function useAi(): AiContextValue {
  return useAiContext();
}
