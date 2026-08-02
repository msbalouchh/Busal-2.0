import "server-only";

import type { WorkflowStepRecord } from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";

export function resolveStepDependencies(steps: WorkflowStepRecord[]): WorkflowStepRecord[] {
  return [...steps].sort((left, right) => left.order - right.order);
}

export function getParallelStepGroups(steps: WorkflowStepRecord[]): WorkflowStepRecord[][] {
  const sorted = resolveStepDependencies(steps);
  const groups: WorkflowStepRecord[][] = [];
  let currentGroup: WorkflowStepRecord[] = [];

  for (const step of sorted) {
    const mode = (step.configuration.mode as string | undefined) ?? "sequential";
    if (mode === "parallel" && currentGroup.length > 0) {
      currentGroup.push(step);
    } else {
      if (currentGroup.length > 0) groups.push(currentGroup);
      currentGroup = [step];
    }
  }

  if (currentGroup.length > 0) groups.push(currentGroup);
  return groups;
}

export function shouldExecuteStep(
  step: WorkflowStepRecord,
  context: Record<string, unknown>,
): boolean {
  if (!step.condition) return true;
  if (step.condition === "always") return true;
  if (step.condition.startsWith("context.")) {
    const key = step.condition.replace("context.", "");
    return Boolean(context[key]);
  }
  return true;
}

export function getNextStepOrder(currentOrder: number, steps: WorkflowStepRecord[]): number | null {
  const sorted = resolveStepDependencies(steps);
  const next = sorted.find((step) => step.order > currentOrder);
  return next?.order ?? null;
}
