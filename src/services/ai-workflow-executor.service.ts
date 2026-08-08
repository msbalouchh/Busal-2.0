import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { serializeWorkflowExecution } from "@/modules/ai-orchestrator-management/lib/ai-orchestrator-validation";
import type {
  OrchestratorContextState,
  WorkflowExecutionInput,
  WorkflowExecutionRecord,
} from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";
import {
  buildWorkflowOutput,
  createOrchestratorContext,
  loadMemoryContextForWorkflow,
  mergeStepResult,
} from "@/services/ai-orchestrator-context-manager.service";
import { shouldExecuteStep } from "@/services/ai-dependency-resolver.service";
import {
  buildStepInput,
  buildSkillRouteMetadata,
  routeStepExecution,
} from "@/services/ai-task-router.service";
import { getWorkflow, listWorkflowSteps } from "@/services/ai-workflow-manager.service";
import { getPlatformAgent } from "@/services/ai-agent-platform-manager.service";
import { runCentralAiChatForOwner } from "@/services/ai-engine-bridge.service";
import { executeSkill } from "@/services/ai-skill-executor.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function executeWorkflowStep(
  ownerId: string,
  step: Awaited<ReturnType<typeof listWorkflowSteps>>[number],
  context: OrchestratorContextState,
  agentId?: string | null,
  staffId?: string | null,
): Promise<Record<string, unknown>> {
  const route = routeStepExecution(step);
  const stepInput = buildStepInput(context.shared, step);

  if (route === "skill" && step.skillId) {
    const result = await executeSkill(
      ownerId,
      {
        skillId: step.skillId,
        agentId: step.agentId ?? agentId ?? null,
        input: stepInput,
        metadata: buildSkillRouteMetadata(step),
      },
      staffId,
    );
    return { executionId: result.id, output: result.output, status: result.status };
  }

  if (route === "agent" && step.agentId) {
    const agentRecord = await getPlatformAgent(ownerId, step.agentId);
    const userMessage =
      typeof stepInput.message === "string"
        ? stepInput.message
        : JSON.stringify(stepInput ?? {});

    const engineResult = await runCentralAiChatForOwner(ownerId, {
      message: userMessage,
      agentSlug: agentRecord.slug,
      currentModule: "ai-workflow",
      enableTools: true,
      metadata: {
        workflowStepId: step.id,
        stepOrder: step.order,
        agentId: step.agentId,
      },
    });

    return {
      routed: "agent",
      agentId: step.agentId,
      executionId: engineResult.auditId,
      output: { content: engineResult.content },
      status: "COMPLETED",
      providerId: engineResult.providerId,
      input: stepInput,
    };
  }

  return {
    routed: "noop",
    message: `Step ${step.order} completed without external execution`,
    input: stepInput,
  };
}

export async function runWorkflow(
  ownerId: string,
  payload: WorkflowExecutionInput,
  staffId?: string | null,
): Promise<WorkflowExecutionRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const workflow = await getWorkflow(ownerId, payload.workflowId);
  if (workflow.status !== "ACTIVE" && workflow.status !== "DRAFT") {
    throw new Error(`Workflow is not runnable: ${workflow.status}`);
  }

  const steps = await listWorkflowSteps(ownerId, payload.workflowId);
  const startedAt = new Date();
  const memoryContext = await loadMemoryContextForWorkflow(ownerId, payload.input ?? {});

  let context = createOrchestratorContext({
    ...(payload.input ?? {}),
    ...memoryContext,
  });

  const execution = await prisma.aIWorkflowExecution.create({
    data: {
      workflowId: workflow.id,
      businessId,
      staffId: staffId ?? null,
      status: "RUNNING",
      startedAt,
      input: (payload.input ?? {}) as Prisma.InputJsonValue,
      metadata: (payload.metadata ?? {}) as Prisma.InputJsonValue,
    },
    include: { workflow: { select: { name: true } } },
  });

  try {
    for (const step of steps) {
      if (!shouldExecuteStep(step, context.shared)) {
        context = mergeStepResult(context, step, { skipped: true, reason: step.condition });
        continue;
      }

      const result = await executeWorkflowStep(ownerId, step, context, null, staffId);
      context = mergeStepResult(context, step, result);
    }

    const output = buildWorkflowOutput(context);
    const completedAt = new Date();
    const updated = await prisma.aIWorkflowExecution.update({
      where: { id: execution.id },
      data: {
        status: "COMPLETED",
        completedAt,
        duration: completedAt.getTime() - startedAt.getTime(),
        output: output as Prisma.InputJsonValue,
        metadata: {
          ...(typeof execution.metadata === "object" && !Array.isArray(execution.metadata)
            ? (execution.metadata as Record<string, unknown>)
            : {}),
          stepCount: steps.length,
        } as Prisma.InputJsonValue,
      },
      include: { workflow: { select: { name: true } } },
    });

    await prisma.aiAgentAuditLog.create({
      data: {
        businessId,
        staffId,
        entityType: "ai_workflow_execution",
        entityId: updated.id,
        action: "workflow.execute",
        metadata: { workflowId: workflow.id } as Prisma.InputJsonValue,
      },
    });

    return serializeWorkflowExecution(updated);
  } catch (error) {
    const completedAt = new Date();
    const updated = await prisma.aIWorkflowExecution.update({
      where: { id: execution.id },
      data: {
        status: "FAILED",
        completedAt,
        duration: completedAt.getTime() - startedAt.getTime(),
        error: error instanceof Error ? error.message : "Workflow execution failed",
      },
      include: { workflow: { select: { name: true } } },
    });
    return serializeWorkflowExecution(updated);
  }
}

export async function pauseWorkflowExecution(
  ownerId: string,
  executionId: string,
): Promise<WorkflowExecutionRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const execution = await prisma.aIWorkflowExecution.findFirst({
    where: { id: executionId, businessId },
    include: { workflow: { select: { name: true } } },
  });
  if (!execution) throw new Error("Workflow execution not found");
  if (execution.status !== "RUNNING") throw new Error("Only running executions can be paused");

  const updated = await prisma.aIWorkflowExecution.update({
    where: { id: executionId },
    data: { status: "WAITING" },
    include: { workflow: { select: { name: true } } },
  });

  return serializeWorkflowExecution(updated);
}

export async function resumeWorkflowExecution(
  ownerId: string,
  executionId: string,
): Promise<WorkflowExecutionRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const execution = await prisma.aIWorkflowExecution.findFirst({
    where: { id: executionId, businessId },
    include: { workflow: { select: { name: true } } },
  });
  if (!execution) throw new Error("Workflow execution not found");
  if (execution.status !== "WAITING") throw new Error("Only waiting executions can be resumed");

  const updated = await prisma.aIWorkflowExecution.update({
    where: { id: executionId },
    data: { status: "RUNNING" },
    include: { workflow: { select: { name: true } } },
  });

  return serializeWorkflowExecution(updated);
}

export async function cancelWorkflowExecution(
  ownerId: string,
  executionId: string,
): Promise<WorkflowExecutionRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const execution = await prisma.aIWorkflowExecution.findFirst({
    where: { id: executionId, businessId },
    include: { workflow: { select: { name: true } } },
  });
  if (!execution) throw new Error("Workflow execution not found");

  const updated = await prisma.aIWorkflowExecution.update({
    where: { id: executionId },
    data: {
      status: "CANCELLED",
      completedAt: new Date(),
    },
    include: { workflow: { select: { name: true } } },
  });

  return serializeWorkflowExecution(updated);
}

export async function retryFailedWorkflowExecution(
  ownerId: string,
  executionId: string,
  staffId?: string | null,
): Promise<WorkflowExecutionRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const execution = await prisma.aIWorkflowExecution.findFirst({
    where: { id: executionId, businessId },
  });
  if (!execution) throw new Error("Workflow execution not found");
  if (execution.status !== "FAILED") throw new Error("Only failed executions can be retried");

  return runWorkflow(
    ownerId,
    {
      workflowId: execution.workflowId,
      input: execution.input as Record<string, unknown>,
      metadata: { retriedFrom: executionId },
    },
    staffId,
  );
}

export async function listWorkflowExecutions(
  ownerId: string,
  workflowId?: string,
  limit = 50,
): Promise<WorkflowExecutionRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const executions = await prisma.aIWorkflowExecution.findMany({
    where: {
      businessId,
      ...(workflowId ? { workflowId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { workflow: { select: { name: true } } },
  });

  return executions.map(serializeWorkflowExecution);
}

export async function getWorkflowExecution(
  ownerId: string,
  executionId: string,
): Promise<WorkflowExecutionRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const execution = await prisma.aIWorkflowExecution.findFirst({
    where: { id: executionId, businessId },
    include: { workflow: { select: { name: true } } },
  });
  if (!execution) throw new Error("Workflow execution not found");
  return serializeWorkflowExecution(execution);
}
