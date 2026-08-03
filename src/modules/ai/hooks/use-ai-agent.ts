"use client";

import { useCallback, useState } from "react";

import { useAi } from "@/modules/ai/hooks/use-ai";
import { aiOrchestrator } from "@/modules/ai/orchestrator/ai-orchestrator";
import { buildAiRuntimeContext } from "@/modules/ai/services/mock-ai.service";
import type { OrchestratorRunResult } from "@/modules/ai/orchestrator/ai-orchestrator";

export function useAiAgent(agentSlug?: string) {
  const { activeAgentSlug, setActiveAgent, context, refresh } = useAi();
  const resolvedSlug = agentSlug ?? activeAgentSlug;
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<OrchestratorRunResult | null>(null);

  const run = useCallback(
    async (userMessage: string, conversationId?: string) => {
      if (!resolvedSlug) {
        throw new Error("No active agent selected.");
      }

      setIsRunning(true);

      try {
        const result = await aiOrchestrator.run({
          agentSlug: resolvedSlug,
          userMessage,
          conversationId,
          runtime: buildAiRuntimeContext({
            userId: context.userId,
            tenantId: context.tenantId ?? undefined,
            workspaceId: context.workspaceId ?? undefined,
            businessId: context.businessId ?? undefined,
            branchId: context.branchId ?? undefined,
            activeAgentSlug: resolvedSlug,
          }),
        });

        setLastResult(result);
        refresh();
        return result;
      } finally {
        setIsRunning(false);
      }
    },
    [resolvedSlug, context, refresh],
  );

  return {
    agentSlug: resolvedSlug,
    setActiveAgent,
    isRunning,
    lastResult,
    run,
  };
}
