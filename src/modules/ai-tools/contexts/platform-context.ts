"use client";

import { createContext } from "react";

import type { AiToolsPlatformContextValue } from "@/modules/ai-tools/types";

export const AiToolsPlatformContext = createContext<AiToolsPlatformContextValue | null>(null);

AiToolsPlatformContext.displayName = "AiToolsPlatformContext";
