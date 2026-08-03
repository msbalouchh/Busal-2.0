"use client";

import { useCallback, useState } from "react";

import { useAiToolsPlatform } from "@/modules/ai-tools/hooks/use-ai-tools-platform";
import { skillExecutor } from "@/modules/ai-tools/executors/skill-executor";
import type { PlatformSkillExecutionResult } from "@/modules/ai-tools/types/skill";

export function useSkillExecution(skillId: string) {
  const { context } = useAiToolsPlatform();
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<PlatformSkillExecutionResult | null>(null);

  const execute = useCallback(
    async (input: Record<string, unknown>) => {
      setIsExecuting(true);

      try {
        const result = await skillExecutor.execute({
          skillId,
          input,
          context,
        });

        setLastResult(result);
        return result;
      } finally {
        setIsExecuting(false);
      }
    },
    [skillId, context],
  );

  return { execute, isExecuting, lastResult };
}
