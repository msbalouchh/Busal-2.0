import "server-only";

import type { PlatformAutomationTriggerType, PlatformWorkflowStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/automation-context.service";
import { writeAutomationLog } from "@/services/automation-logger.service";

export async function listAutomationWorkflows(ownerId: string, status?: PlatformWorkflowStatus) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.automationPlatformWorkflow.findMany({
    where: { businessId, ...(status ? { status } : {}) },
    include: {
      triggers: true,
      conditions: true,
      actions: { orderBy: { order: "asc" } },
      _count: { select: { executions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getAutomationWorkflow(ownerId: string, workflowId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.automationPlatformWorkflow.findFirst({
    where: { id: workflowId, businessId },
    include: {
      triggers: true,
      conditions: true,
      actions: { orderBy: { order: "asc" } },
    },
  });
}

export async function createAutomationWorkflow(
  ownerId: string,
  input: {
    name: string;
    description?: string;
    triggerType: PlatformAutomationTriggerType;
    configuration?: Record<string, unknown>;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const workflow = await prisma.automationPlatformWorkflow.create({
    data: {
      businessId,
      name: input.name,
      description: input.description ?? "",
      triggerType: input.triggerType,
      status: "DRAFT",
      enabled: false,
      configuration: (input.configuration ?? {}) as Prisma.InputJsonValue,
    },
    include: { triggers: true, conditions: true, actions: true },
  });

  await writeAutomationLog(businessId, {
    workflowId: workflow.id,
    level: "INFO",
    message: `Workflow created: ${workflow.name}`,
  });

  return workflow;
}

export async function updateAutomationWorkflow(
  ownerId: string,
  workflowId: string,
  input: {
    name?: string;
    description?: string;
    status?: PlatformWorkflowStatus;
    enabled?: boolean;
    triggerType?: PlatformAutomationTriggerType;
    configuration?: Record<string, unknown>;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.automationPlatformWorkflow.findFirst({
    where: { id: workflowId, businessId },
  });
  if (!existing) return null;

  return prisma.automationPlatformWorkflow.update({
    where: { id: workflowId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.triggerType !== undefined ? { triggerType: input.triggerType } : {}),
      ...(input.configuration !== undefined
        ? { configuration: input.configuration as Prisma.InputJsonValue }
        : {}),
    },
    include: {
      triggers: true,
      conditions: true,
      actions: { orderBy: { order: "asc" } },
    },
  });
}

export async function deleteAutomationWorkflow(ownerId: string, workflowId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.automationPlatformWorkflow.findFirst({
    where: { id: workflowId, businessId },
  });
  if (!existing) return false;

  await prisma.automationPlatformWorkflow.delete({ where: { id: workflowId } });
  await writeAutomationLog(businessId, {
    workflowId,
    level: "INFO",
    message: `Workflow deleted: ${existing.name}`,
  });
  return true;
}

export async function pauseAutomationWorkflow(ownerId: string, workflowId: string) {
  return updateAutomationWorkflow(ownerId, workflowId, { status: "PAUSED", enabled: false });
}

export async function resumeAutomationWorkflow(ownerId: string, workflowId: string) {
  return updateAutomationWorkflow(ownerId, workflowId, { status: "ACTIVE", enabled: true });
}

export async function saveWorkflowBuilder(
  ownerId: string,
  workflowId: string,
  input: {
    triggers: Array<{ type: string; event: string; configuration?: Record<string, unknown> }>;
    conditions: Array<{
      operator: string;
      field: string;
      value: string;
      configuration?: Record<string, unknown>;
    }>;
    actions: Array<{ type: string; order: number; configuration?: Record<string, unknown> }>;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const workflow = await prisma.automationPlatformWorkflow.findFirst({
    where: { id: workflowId, businessId },
  });
  if (!workflow) throw new Error("Workflow not found");

  await prisma.$transaction([
    prisma.automationPlatformTrigger.deleteMany({ where: { workflowId } }),
    prisma.automationPlatformCondition.deleteMany({ where: { workflowId } }),
    prisma.automationPlatformAction.deleteMany({ where: { workflowId } }),
    ...input.triggers.map((trigger) =>
      prisma.automationPlatformTrigger.create({
        data: {
          workflowId,
          type: trigger.type,
          event: trigger.event,
          configuration: (trigger.configuration ?? {}) as Prisma.InputJsonValue,
        },
      }),
    ),
    ...input.conditions.map((condition) =>
      prisma.automationPlatformCondition.create({
        data: {
          workflowId,
          operator: condition.operator,
          field: condition.field,
          value: condition.value,
          configuration: (condition.configuration ?? {}) as Prisma.InputJsonValue,
        },
      }),
    ),
    ...input.actions.map((action) =>
      prisma.automationPlatformAction.create({
        data: {
          workflowId,
          type: action.type,
          order: action.order,
          configuration: (action.configuration ?? {}) as Prisma.InputJsonValue,
        },
      }),
    ),
  ]);

  return getAutomationWorkflow(ownerId, workflowId);
}

export async function getAutomationDashboardSummary(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const [workflows, executions, activeCount, failedCount] = await Promise.all([
    prisma.automationPlatformWorkflow.count({ where: { businessId } }),
    prisma.automationPlatformExecution.count({ where: { businessId } }),
    prisma.automationPlatformWorkflow.count({
      where: { businessId, status: "ACTIVE", enabled: true },
    }),
    prisma.automationPlatformExecution.count({ where: { businessId, status: "FAILED" } }),
  ]);

  return { workflows, executions, activeCount, failedCount };
}
