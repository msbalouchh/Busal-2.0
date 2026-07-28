import type { AutomationExecutionStatus, AutomationTriggerType, Prisma } from "@prisma/client";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { executeAutomationAction } from "@/modules/ai-automation/engine/action-engine";
import { runAiDecisionNode } from "@/modules/ai-automation/engine/ai-decision-node";
import {
  canApproveAutomationStep,
  getApprovalTypeFromNode,
} from "@/modules/ai-automation/engine/approval-engine";
import { evaluateConditionExpression } from "@/modules/ai-automation/engine/condition-engine";
import type {
  ConditionExpression,
  WorkflowExecutionContext,
  WorkflowNode,
} from "@/modules/ai-automation/types/automation-types";

export interface WorkflowEngineDependencies {
  createExecution: (input: {
    businessId: string;
    branchId: string | null;
    workflowId: string;
    versionId: string;
    triggerType: AutomationTriggerType;
    eventId?: string | null;
    input?: Record<string, unknown>;
  }) => Promise<{ id: string }>;
  updateExecution: (
    executionId: string,
    input: {
      status: AutomationExecutionStatus;
      output?: Record<string, unknown> | null;
      errorDetails?: string | null;
      durationMs?: number | null;
      aiDecisionCount?: number;
      aiCostTokens?: number;
      startedAt?: Date | null;
      completedAt?: Date | null;
    },
  ) => Promise<void>;
  createStep: (input: {
    executionId: string;
    nodeId: string;
    nodeType: WorkflowNode["type"];
    status: AutomationExecutionStatus;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    confidenceScore?: number;
    reasoning?: string;
    errorDetails?: string;
    durationMs?: number;
  }) => Promise<void>;
  createApproval: (input: {
    executionId: string;
    businessId: string;
    nodeId: string;
    approvalType: ReturnType<typeof getApprovalTypeFromNode>;
    approverRole?: string | null;
  }) => Promise<{ id: string }>;
}

function parseNodes(raw: unknown): WorkflowNode[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw as WorkflowNode[];
}

function buildExecutionContext(
  platform: BusinessContext,
  eventPayload: Record<string, unknown>,
): WorkflowExecutionContext {
  return {
    businessId: platform.business.id,
    branchId: platform.branchId,
    userId: platform.user.id,
    staffId: platform.staffSession?.staffId ?? null,
    permissions: platform.permissions,
    roleSlug: platform.roleSlug,
    eventPayload,
    variables: { ...eventPayload },
  };
}

export async function executeWorkflowVersion(
  platform: BusinessContext,
  input: {
    workflowId: string;
    versionId: string;
    triggerType: AutomationTriggerType;
    nodes: unknown;
    eventId?: string | null;
    eventPayload?: Record<string, unknown>;
    executionId?: string;
    startAfterNodeId?: string | null;
  },
  dependencies: WorkflowEngineDependencies,
): Promise<{
  executionId: string;
  status: AutomationExecutionStatus;
  awaitingApproval: boolean;
  approvalRequestId: string | null;
  output: Record<string, unknown> | null;
}> {
  const startedAt = Date.now();
  const nodes = parseNodes(input.nodes);
  const context = buildExecutionContext(platform, input.eventPayload ?? {});
  let resumeReached = !input.startAfterNodeId;

  const execution = input.executionId
    ? { id: input.executionId }
    : await dependencies.createExecution({
        businessId: platform.business.id,
        branchId: platform.branchId,
        workflowId: input.workflowId,
        versionId: input.versionId,
        triggerType: input.triggerType,
        eventId: input.eventId ?? null,
        input: input.eventPayload ?? {},
      });

  if (!input.executionId) {
    await dependencies.updateExecution(execution.id, {
      status: "RUNNING",
      startedAt: new Date(),
    });
  } else {
    await dependencies.updateExecution(execution.id, {
      status: "RUNNING",
    });
  }

  let aiDecisionCount = 0;
  let aiCostTokens = 0;
  let finalOutput: Record<string, unknown> | null = null;

  try {
    for (const node of nodes) {
      if (!resumeReached) {
        if (node.id === input.startAfterNodeId) {
          resumeReached = true;
        }
        continue;
      }

      const stepStarted = Date.now();

      if (node.type === "TRIGGER") {
        await dependencies.createStep({
          executionId: execution.id,
          nodeId: node.id,
          nodeType: node.type,
          status: "COMPLETED",
          input: context.eventPayload,
          output: { triggered: true },
          durationMs: Date.now() - stepStarted,
        });
        continue;
      }

      if (node.type === "CONDITION") {
        const expression = node.config.expression as ConditionExpression;
        const passed = evaluateConditionExpression(expression, context);

        await dependencies.createStep({
          executionId: execution.id,
          nodeId: node.id,
          nodeType: node.type,
          status: passed ? "COMPLETED" : "FAILED",
          input: { expression },
          output: { passed },
          durationMs: Date.now() - stepStarted,
        });

        if (!passed) {
          await dependencies.updateExecution(execution.id, {
            status: "COMPLETED",
            output: { skipped: true, reason: "Condition not met" },
            durationMs: Date.now() - startedAt,
            completedAt: new Date(),
            aiDecisionCount,
            aiCostTokens,
          });

          return {
            executionId: execution.id,
            status: "COMPLETED",
            awaitingApproval: false,
            approvalRequestId: null,
            output: { skipped: true },
          };
        }

        continue;
      }

      if (node.type === "AI_DECISION") {
        const decision = await runAiDecisionNode(platform, node, context);
        aiDecisionCount += 1;
        aiCostTokens += 50;
        context.variables.aiDecision = decision.structuredOutput;

        await dependencies.createStep({
          executionId: execution.id,
          nodeId: node.id,
          nodeType: node.type,
          status: "COMPLETED",
          input: node.config as Record<string, unknown>,
          output: decision.structuredOutput,
          confidenceScore: decision.confidenceScore,
          reasoning: decision.reasoning,
          durationMs: Date.now() - stepStarted,
        });

        continue;
      }

      if (node.type === "APPROVAL") {
        const approvalType = getApprovalTypeFromNode(node);
        const approverRole =
          typeof node.config.approverRole === "string" ? node.config.approverRole : null;

        if (!canApproveAutomationStep(platform, approvalType, approverRole)) {
          const approval = await dependencies.createApproval({
            executionId: execution.id,
            businessId: platform.business.id,
            nodeId: node.id,
            approvalType,
            approverRole,
          });

          await dependencies.createStep({
            executionId: execution.id,
            nodeId: node.id,
            nodeType: node.type,
            status: "AWAITING_APPROVAL",
            input: node.config as Record<string, unknown>,
            output: { approvalRequestId: approval.id },
            durationMs: Date.now() - stepStarted,
          });

          await dependencies.updateExecution(execution.id, {
            status: "AWAITING_APPROVAL",
            output: { approvalRequestId: approval.id },
            durationMs: Date.now() - startedAt,
            aiDecisionCount,
            aiCostTokens,
          });

          return {
            executionId: execution.id,
            status: "AWAITING_APPROVAL",
            awaitingApproval: true,
            approvalRequestId: approval.id,
            output: { approvalRequestId: approval.id },
          };
        }

        await dependencies.createStep({
          executionId: execution.id,
          nodeId: node.id,
          nodeType: node.type,
          status: "COMPLETED",
          input: node.config as Record<string, unknown>,
          output: { autoApproved: true },
          durationMs: Date.now() - stepStarted,
        });

        continue;
      }

      if (node.type === "ACTION") {
        const output = await executeAutomationAction(platform, node, context);
        finalOutput = output;

        await dependencies.createStep({
          executionId: execution.id,
          nodeId: node.id,
          nodeType: node.type,
          status: "COMPLETED",
          input: node.config as Record<string, unknown>,
          output,
          durationMs: Date.now() - stepStarted,
        });

        continue;
      }

      if (node.type === "COMPLETION") {
        await dependencies.createStep({
          executionId: execution.id,
          nodeId: node.id,
          nodeType: node.type,
          status: "COMPLETED",
          output: { completed: true },
          durationMs: Date.now() - stepStarted,
        });
      }
    }

    await dependencies.updateExecution(execution.id, {
      status: "COMPLETED",
      output: finalOutput,
      durationMs: Date.now() - startedAt,
      completedAt: new Date(),
      aiDecisionCount,
      aiCostTokens,
    });

    return {
      executionId: execution.id,
      status: "COMPLETED",
      awaitingApproval: false,
      approvalRequestId: null,
      output: finalOutput,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow execution failed";

    await dependencies.updateExecution(execution.id, {
      status: "FAILED",
      errorDetails: message,
      durationMs: Date.now() - startedAt,
      completedAt: new Date(),
      aiDecisionCount,
      aiCostTokens,
    });

    return {
      executionId: execution.id,
      status: "FAILED",
      awaitingApproval: false,
      approvalRequestId: null,
      output: null,
    };
  }
}

export type { Prisma };
