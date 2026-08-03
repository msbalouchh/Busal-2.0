"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { AiContext } from "@/modules/ai/contexts/ai-context";
import {
  buildAiPlatformContext,
  buildAiPlatformSnapshot,
  type AiPlatformInput,
} from "@/modules/ai/services/mock-ai.service";
import type { AiContextValue } from "@/modules/ai/types/context";

interface AIContextProviderProps {
  children: ReactNode;
  initialInput?: AiPlatformInput;
}

/** Provides AI platform context to the component tree. */
export function AIContextProvider({ children, initialInput }: AIContextProviderProps) {
  const [input] = useState<AiPlatformInput>(() => initialInput ?? {});
  const [snapshot, setSnapshot] = useState(() => buildAiPlatformSnapshot(input));
  const [activeAgentSlug, setActiveAgentSlug] = useState<string | null>(
    () => input.activeAgentSlug ?? snapshot.agents[0]?.slug ?? null,
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSnapshot(buildAiPlatformSnapshot(input));
  }, [input]);

  const value = useMemo<AiContextValue>(() => {
    const context = buildAiPlatformContext({
      ...input,
      activeAgentSlug,
    });

    return {
      context: {
        ...context,
        activeAgentSlug,
        activeConversationId,
      },
      activeAgentSlug,
      activeConversationId,
      setActiveAgent: setActiveAgentSlug,
      setActiveConversation: setActiveConversationId,
      refresh,
    };
  }, [input, activeAgentSlug, activeConversationId, refresh]);

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
}
