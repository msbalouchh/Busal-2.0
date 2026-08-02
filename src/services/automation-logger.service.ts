import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/automation-context.service";

export type AutomationLogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

interface AutomationLogEntry {
  level: AutomationLogLevel;
  message: string;
  timestamp: string;
}

export async function writeAutomationLog(
  businessId: string,
  input: {
    workflowId?: string;
    executionId?: string;
    level: AutomationLogLevel;
    message: string;
    metadata?: Record<string, unknown>;
  },
) {
  if (input.executionId) {
    await appendExecutionLog(input.executionId, input.level, input.message, input.metadata);
    return;
  }

  const workflow = input.workflowId
    ? await prisma.automationPlatformWorkflow.findFirst({
        where: { id: input.workflowId, businessId },
        select: { configuration: true },
      })
    : null;

  if (!workflow) return;

  const configuration = (workflow.configuration ?? {}) as Record<string, unknown>;
  const logs = Array.isArray(configuration.logs)
    ? (configuration.logs as AutomationLogEntry[])
    : [];
  logs.unshift({
    level: input.level,
    message: input.message,
    timestamp: new Date().toISOString(),
  });

  await prisma.automationPlatformWorkflow.update({
    where: { id: input.workflowId },
    data: {
      configuration: {
        ...configuration,
        logs: logs.slice(0, 100),
        ...(input.metadata ?? {}),
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function appendExecutionLog(
  executionId: string,
  level: AutomationLogLevel,
  message: string,
  metadata?: Record<string, unknown>,
) {
  const execution = await prisma.automationPlatformExecution.findUnique({
    where: { id: executionId },
    select: { metadata: true },
  });
  if (!execution) return;

  const current = (execution.metadata ?? {}) as Record<string, unknown>;
  const logs = Array.isArray(current.logs) ? (current.logs as AutomationLogEntry[]) : [];
  logs.push({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  });

  await prisma.automationPlatformExecution.update({
    where: { id: executionId },
    data: {
      metadata: {
        ...current,
        logs,
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function listAutomationLogs(ownerId: string, limit = 50) {
  const businessId = await getOwnedBusinessId(ownerId);
  const executions = await prisma.automationPlatformExecution.findMany({
    where: { businessId },
    select: {
      id: true,
      workflowId: true,
      status: true,
      metadata: true,
      startedAt: true,
      workflow: { select: { name: true } },
    },
    orderBy: { startedAt: "desc" },
    take: limit,
  });

  const logs: Array<{
    id: string;
    workflowId: string;
    workflowName: string;
    executionId: string;
    level: AutomationLogLevel;
    message: string;
    timestamp: string;
  }> = [];

  for (const execution of executions) {
    const metadata = execution.metadata as Record<string, unknown>;
    const entries = Array.isArray(metadata.logs) ? (metadata.logs as AutomationLogEntry[]) : [];
    for (const entry of entries) {
      logs.push({
        id: `${execution.id}-${entry.timestamp}`,
        workflowId: execution.workflowId,
        workflowName: execution.workflow.name,
        executionId: execution.id,
        level: entry.level,
        message: entry.message,
        timestamp: entry.timestamp,
      });
    }
  }

  return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit);
}
