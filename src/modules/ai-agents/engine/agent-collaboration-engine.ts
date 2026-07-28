import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  runAgentExecution,
  type AgentVersionProfile,
} from "@/modules/ai-agents/engine/agent-execution-engine";
import {
  assertAgentBranchScope,
  assertAgentPermissions,
  buildAgentExecutionContext,
  type MemoryEngineDependencies,
} from "@/modules/ai-agents/engine/agent-memory-engine";
import type { AgentDelegationRequest } from "@/modules/ai-agents/types/agent-types";

export interface DelegationEngineDependencies extends MemoryEngineDependencies {
  createDelegation: (input: AgentDelegationRequest) => Promise<{ id: string }>;
  updateDelegation: (
    delegationId: string,
    input: { status: string; executionId?: string; completedAt?: Date },
  ) => Promise<void>;
  loadAgent: (agentRecordId: string) => Promise<{
    id: string;
    branchId: string | null;
    status: string;
    profile: AgentVersionProfile;
  } | null>;
  createExecution: (input: {
    agentRecordId: string;
    triggerType: string;
    input: Record<string, unknown>;
    parentExecutionId?: string | null;
  }) => Promise<{ id: string }>;
  finalizeExecution: (
    executionId: string,
    input: {
      status: string;
      output?: Record<string, unknown>;
      tokensUsed?: number;
      costCents?: number;
      knowledgeHits?: number;
      toolCalls?: number;
      durationMs?: number;
      errorDetails?: string | null;
    },
  ) => Promise<void>;
}

export async function delegateAgentTask(
  platform: BusinessContext,
  request: AgentDelegationRequest,
  dependencies: DelegationEngineDependencies,
): Promise<{ delegationId: string; executionId: string; output: Record<string, unknown> }> {
  assertAgentPermissions(platform, [
    PERMISSION_CODES.AI_AGENT_VIEW,
    PERMISSION_CODES.AI_AGENT_DEPLOY,
  ]);

  const fromAgent = await dependencies.loadAgent(request.fromAgentRecordId);
  const toAgent = await dependencies.loadAgent(request.toAgentRecordId);

  if (!fromAgent || !toAgent) {
    throw new Error("Delegation agents not found");
  }

  if (toAgent.status !== "PUBLISHED" && toAgent.status !== "TESTING") {
    throw new Error("Target agent is not deployable");
  }

  assertAgentBranchScope(platform, toAgent.branchId);

  const delegation = await dependencies.createDelegation(request);
  const startedAt = Date.now();

  const execution = await dependencies.createExecution({
    agentRecordId: request.toAgentRecordId,
    triggerType: "MANUAL",
    input: {
      delegatedFrom: request.fromAgentRecordId,
      taskSummary: request.taskSummary,
      ...(request.metadata ?? {}),
    },
    parentExecutionId: request.parentExecutionId ?? null,
  });

  try {
    const context = buildAgentExecutionContext(platform, {
      taskSummary: request.taskSummary,
      delegatedFrom: request.fromAgentRecordId,
    });

    const result = await runAgentExecution(
      platform,
      {
        agentRecordId: request.toAgentRecordId,
        agentBranchId: toAgent.branchId,
        profile: toAgent.profile,
        context,
      },
      dependencies,
    );

    await dependencies.finalizeExecution(execution.id, {
      status: "COMPLETED",
      output: result.structuredOutput,
      tokensUsed: result.tokensUsed,
      costCents: result.costCents,
      knowledgeHits: result.knowledgeHits,
      toolCalls: result.toolCalls,
      durationMs: Date.now() - startedAt,
    });

    await dependencies.updateDelegation(delegation.id, {
      status: "COMPLETED",
      executionId: execution.id,
      completedAt: new Date(),
    });

    return {
      delegationId: delegation.id,
      executionId: execution.id,
      output: result.structuredOutput,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delegation failed";

    await dependencies.finalizeExecution(execution.id, {
      status: "FAILED",
      errorDetails: message,
      durationMs: Date.now() - startedAt,
    });

    await dependencies.updateDelegation(delegation.id, {
      status: "FAILED",
      executionId: execution.id,
      completedAt: new Date(),
    });

    throw error;
  }
}
