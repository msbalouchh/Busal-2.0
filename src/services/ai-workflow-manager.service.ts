import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  serializeWorkflow,
  serializeWorkflowStep,
  validateWorkflowInput,
  validateWorkflowListQuery,
  validateWorkflowSteps,
  validateWorkflowUpdateInput,
} from "@/modules/ai-orchestrator-management/lib/ai-orchestrator-validation";
import type {
  WorkflowDashboardStats,
  WorkflowInput,
  WorkflowListQuery,
  WorkflowListResult,
  WorkflowRecord,
  WorkflowStepInput,
  WorkflowStepRecord,
  WorkflowUpdateInput,
} from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function logWorkflowAudit(
  businessId: string,
  staffId: string | null,
  entityId: string,
  action: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await prisma.aiAgentAuditLog.create({
    data: {
      businessId,
      staffId,
      entityType: "ai_workflow",
      entityId,
      action,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

function buildWorkflowWhere(
  businessId: string,
  query: WorkflowListQuery,
): Prisma.AIWorkflowWhereInput {
  return {
    businessId,
    ...(query.status && query.status !== "ALL" ? { status: query.status } : {}),
    ...(query.search?.trim()
      ? {
          OR: [
            { name: { contains: query.search.trim(), mode: "insensitive" } },
            { description: { contains: query.search.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function listWorkflows(
  ownerId: string,
  query: WorkflowListQuery = {},
): Promise<WorkflowListResult> {
  const validated = validateWorkflowListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const where = buildWorkflowWhere(businessId, validated);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

  const [total, items] = await Promise.all([
    prisma.aIWorkflow.count({ where }),
    prisma.aIWorkflow.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { steps: true, executions: true } } },
    }),
  ]);

  return {
    items: items.map(serializeWorkflow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getWorkflow(ownerId: string, workflowId: string): Promise<WorkflowRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const workflow = await prisma.aIWorkflow.findFirst({
    where: { id: workflowId, businessId },
    include: { _count: { select: { steps: true, executions: true } } },
  });
  if (!workflow) throw new Error("Workflow not found");
  return serializeWorkflow(workflow);
}

export async function listWorkflowSteps(
  ownerId: string,
  workflowId: string,
): Promise<WorkflowStepRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const workflow = await prisma.aIWorkflow.findFirst({ where: { id: workflowId, businessId } });
  if (!workflow) throw new Error("Workflow not found");

  const steps = await prisma.aIWorkflowStep.findMany({
    where: { workflowId },
    orderBy: { order: "asc" },
  });

  return steps.map(serializeWorkflowStep);
}

export async function createWorkflow(
  ownerId: string,
  input: WorkflowInput,
  staffId?: string | null,
): Promise<WorkflowRecord> {
  validateWorkflowInput(input);
  if (input.steps?.length) validateWorkflowSteps(input.steps);

  const businessId = await getOwnedBusinessId(ownerId);
  const workflow = await prisma.aIWorkflow.create({
    data: {
      businessId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      status: input.status ?? "DRAFT",
      version: input.version ?? "1.0.0",
      configuration: (input.configuration ?? {}) as Prisma.InputJsonValue,
      steps: input.steps?.length
        ? {
            create: input.steps.map((step) => ({
              order: step.order,
              agentId: step.agentId ?? null,
              skillId: step.skillId ?? null,
              condition: step.condition ?? null,
              configuration: (step.configuration ?? {}) as Prisma.InputJsonValue,
            })),
          }
        : undefined,
    },
    include: { _count: { select: { steps: true, executions: true } } },
  });

  await logWorkflowAudit(businessId, staffId ?? null, workflow.id, "workflow.create");
  return serializeWorkflow(workflow);
}

export async function updateWorkflow(
  ownerId: string,
  workflowId: string,
  input: WorkflowUpdateInput,
  staffId?: string | null,
): Promise<WorkflowRecord> {
  validateWorkflowUpdateInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aIWorkflow.findFirst({ where: { id: workflowId, businessId } });
  if (!existing) throw new Error("Workflow not found");

  const workflow = await prisma.aIWorkflow.update({
    where: { id: workflowId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.version !== undefined ? { version: input.version } : {}),
      ...(input.configuration !== undefined
        ? { configuration: input.configuration as Prisma.InputJsonValue }
        : {}),
    },
    include: { _count: { select: { steps: true, executions: true } } },
  });

  await logWorkflowAudit(businessId, staffId ?? null, workflowId, "workflow.update");
  return serializeWorkflow(workflow);
}

export async function deleteWorkflow(
  ownerId: string,
  workflowId: string,
  staffId?: string | null,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aIWorkflow.findFirst({ where: { id: workflowId, businessId } });
  if (!existing) throw new Error("Workflow not found");

  await prisma.aIWorkflow.delete({ where: { id: workflowId } });
  await logWorkflowAudit(businessId, staffId ?? null, workflowId, "workflow.delete");
}

export async function replaceWorkflowSteps(
  ownerId: string,
  workflowId: string,
  steps: WorkflowStepInput[],
  staffId?: string | null,
): Promise<WorkflowStepRecord[]> {
  validateWorkflowSteps(steps);
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aIWorkflow.findFirst({ where: { id: workflowId, businessId } });
  if (!existing) throw new Error("Workflow not found");

  await prisma.aIWorkflowStep.deleteMany({ where: { workflowId } });
  await prisma.aIWorkflowStep.createMany({
    data: steps.map((step) => ({
      workflowId,
      order: step.order,
      agentId: step.agentId ?? null,
      skillId: step.skillId ?? null,
      condition: step.condition ?? null,
      configuration: (step.configuration ?? {}) as Prisma.InputJsonValue,
    })),
  });

  await logWorkflowAudit(businessId, staffId ?? null, workflowId, "workflow.steps.replace");
  return listWorkflowSteps(ownerId, workflowId);
}

export async function getWorkflowDashboardStats(ownerId: string): Promise<WorkflowDashboardStats> {
  const businessId = await getOwnedBusinessId(ownerId);

  const [
    totalWorkflows,
    activeWorkflows,
    draftWorkflows,
    totalExecutions,
    runningExecutions,
    failedExecutions,
  ] = await Promise.all([
    prisma.aIWorkflow.count({ where: { businessId } }),
    prisma.aIWorkflow.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.aIWorkflow.count({ where: { businessId, status: "DRAFT" } }),
    prisma.aIWorkflowExecution.count({ where: { businessId } }),
    prisma.aIWorkflowExecution.count({
      where: { businessId, status: { in: ["RUNNING", "WAITING"] } },
    }),
    prisma.aIWorkflowExecution.count({ where: { businessId, status: "FAILED" } }),
  ]);

  return {
    totalWorkflows,
    activeWorkflows,
    draftWorkflows,
    totalExecutions,
    runningExecutions,
    failedExecutions,
  };
}

export async function searchWorkflows(ownerId: string, query: WorkflowListQuery = {}) {
  return listWorkflows(ownerId, query);
}
