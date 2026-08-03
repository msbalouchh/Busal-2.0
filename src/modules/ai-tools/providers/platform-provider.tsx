"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { AiToolsPlatformContext } from "@/modules/ai-tools/contexts/platform-context";
import {
  buildPlatformExecutionContext,
  buildPlatformSnapshot,
  type PlatformContextInput,
} from "@/modules/ai-tools/services/mock-platform.service";
import type { AiToolsPlatformContextValue } from "@/modules/ai-tools/types";

interface AiToolsPlatformProviderProps {
  children: ReactNode;
  initialInput?: PlatformContextInput;
}

/** Provides AI Tool & Skill Platform context to the component tree. */
export function AiToolsPlatformProvider({ children, initialInput }: AiToolsPlatformProviderProps) {
  const [input, setInputState] = useState<PlatformContextInput>(() => initialInput ?? {});
  const [activeAgent, setActiveAgent] = useState(() => input.agentSlug ?? "business-assistant");

  const refresh = useCallback(() => {
    setInputState((current) => ({ ...current }));
  }, []);

  const setActiveAgentSlug = useCallback((agentSlug: string) => {
    setActiveAgent(agentSlug);
    setInputState((current) => ({ ...current, agentSlug }));
  }, []);

  const value = useMemo<AiToolsPlatformContextValue>(() => {
    const snapshot = buildPlatformSnapshot({ ...input, agentSlug: activeAgent });
    const context = buildPlatformExecutionContext({ ...input, agentSlug: activeAgent });

    return {
      context,
      tools: snapshot.tools,
      skills: snapshot.skills,
      capabilities: snapshot.capabilities,
      setActiveAgent: setActiveAgentSlug,
      refresh,
    };
  }, [input, activeAgent, setActiveAgentSlug, refresh]);

  return (
    <AiToolsPlatformContext.Provider value={value}>{children}</AiToolsPlatformContext.Provider>
  );
}
