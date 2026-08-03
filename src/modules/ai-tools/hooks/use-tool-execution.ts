"use client";

import { useCallback, useState } from "react";

import { useAiToolsPlatform } from "@/modules/ai-tools/hooks/use-ai-tools-platform";
import { toolExecutor } from "@/modules/ai-tools/executors/tool-executor";
import type { PlatformToolExecutionResult } from "@/modules/ai-tools/types/platform-tool";

export function useToolExecution(toolId: string) {
  const { context } = useAiToolsPlatform();
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<PlatformToolExecutionResult | null>(null);

  const execute = useCallback(
    async (input: Record<string, unknown>, dryRun = false) => {
      setIsExecuting(true);

      try {
        const result = await toolExecutor.execute({
          toolId,
          input,
          context,
          dryRun,
        });

        setLastResult(result);
        return result;
      } finally {
        setIsExecuting(false);
      }
    },
    [toolId, context],
  );

  return { execute, isExecuting, lastResult };
}
