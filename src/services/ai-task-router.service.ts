import "server-only";

/** Non-inference service — no parallel AI execution. */

import type { WorkflowStepRecord } from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";

export function routeStepExecution(step: WorkflowStepRecord): "skill" | "agent" | "noop" {
  if (step.skillId) return "skill";
  if (step.agentId) return "agent";
  return "noop";
}

export function buildStepInput(
  sharedContext: Record<string, unknown>,
  step: WorkflowStepRecord,
): Record<string, unknown> {
  return {
    ...sharedContext,
    stepOrder: step.order,
    stepConfiguration: step.configuration,
  };
}

export function buildAgentRouteMetadata(step: WorkflowStepRecord): Record<string, unknown> {
  return {
    routedTo: "agent",
    agentId: step.agentId,
    stepOrder: step.order,
  };
}

export function buildSkillRouteMetadata(step: WorkflowStepRecord): Record<string, unknown> {
  return {
    routedTo: "skill",
    skillId: step.skillId,
    stepOrder: step.order,
  };
}
