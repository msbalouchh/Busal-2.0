import "server-only";

import type { WorkflowStepRecord } from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";
import type { OrchestratorContextState } from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";

export function createOrchestratorContext(
  input: Record<string, unknown> = {},
): OrchestratorContextState {
  return {
    shared: { ...input },
    stepResults: [],
  };
}

export function mergeStepResult(
  context: OrchestratorContextState,
  step: WorkflowStepRecord,
  result: Record<string, unknown>,
): OrchestratorContextState {
  return {
    shared: {
      ...context.shared,
      [`step_${step.order}`]: result,
      lastStepOrder: step.order,
    },
    stepResults: [...context.stepResults, { stepId: step.id, order: step.order, result }],
  };
}

export function buildWorkflowOutput(context: OrchestratorContextState): Record<string, unknown> {
  return {
    sharedContext: context.shared,
    stepResults: context.stepResults,
    completedAt: new Date().toISOString(),
  };
}

export async function loadMemoryContextForWorkflow(
  ownerId: string,
  scope: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { buildMemoryContextBundle } = await import("@/services/ai-memory-context-builder.service");
  const bundle = await buildMemoryContextBundle(ownerId, {
    agentId: typeof scope.agentId === "string" ? scope.agentId : undefined,
    staffId: typeof scope.staffId === "string" ? scope.staffId : undefined,
    customerId: typeof scope.customerId === "string" ? scope.customerId : undefined,
    conversationId: typeof scope.conversationId === "string" ? scope.conversationId : undefined,
  });

  return {
    memory: {
      businessCount: bundle.business.length,
      customerCount: bundle.customer.length,
      staffCount: bundle.staff.length,
      workingCount: bundle.working.length,
    },
  };
}
