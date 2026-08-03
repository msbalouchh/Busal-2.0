"use client";

import { createContext } from "react";

import type { AiContextValue } from "@/modules/ai/types/context";

export const AiContext = createContext<AiContextValue | null>(null);

AiContext.displayName = "AiContext";
