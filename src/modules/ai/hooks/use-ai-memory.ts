"use client";

import { useMemo } from "react";

import { useAi } from "@/modules/ai/hooks/use-ai";
import { memoryEngine } from "@/modules/ai/memory/memory-engine";
import type { AiMemoryQuery } from "@/modules/ai/types/memory";

export function useAiMemory(query: AiMemoryQuery = {}) {
  const { context } = useAi();

  const scopedQuery = useMemo<AiMemoryQuery>(
    () => ({
      workspaceId: context.workspaceId,
      businessId: context.businessId,
      userId: context.userId,
      agentSlug: context.activeAgentSlug ?? undefined,
      ...query,
    }),
    [context, query],
  );

  const entries = useMemo(() => memoryEngine.read(scopedQuery), [scopedQuery]);
  const summary = useMemo(() => memoryEngine.summarize(scopedQuery), [scopedQuery]);

  return { entries, summary };
}
