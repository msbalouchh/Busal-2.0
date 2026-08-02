import "server-only";

import type { ExecutionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/automation-context.service";

export async function listAutomationExecutions(
  ownerId: string,
  filters?: { status?: ExecutionStatus; workflowId?: string; limit?: number },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.automationPlatformExecution.findMany({
    where: {
      businessId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.workflowId ? { workflowId: filters.workflowId } : {}),
    },
    include: { workflow: { select: { name: true, triggerType: true } } },
    orderBy: { startedAt: "desc" },
    take: filters?.limit ?? 50,
  });
}

export async function getAutomationExecution(ownerId: string, executionId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.automationPlatformExecution.findFirst({
    where: { id: executionId, businessId },
    include: {
      workflow: {
        select: { name: true, description: true, triggerType: true },
      },
    },
  });
}

export async function searchAutomationExecutions(ownerId: string, query: string, limit = 20) {
  const businessId = await getOwnedBusinessId(ownerId);
  const trimmed = query.trim();
  if (!trimmed) return [];

  return prisma.automationPlatformExecution.findMany({
    where: {
      businessId,
      OR: [
        { error: { contains: trimmed, mode: "insensitive" } },
        { workflow: { name: { contains: trimmed, mode: "insensitive" } } },
      ],
    },
    include: { workflow: { select: { name: true } } },
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

export async function getExecutionHistorySummary(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const [total, completed, failed, running] = await Promise.all([
    prisma.automationPlatformExecution.count({ where: { businessId } }),
    prisma.automationPlatformExecution.count({ where: { businessId, status: "COMPLETED" } }),
    prisma.automationPlatformExecution.count({ where: { businessId, status: "FAILED" } }),
    prisma.automationPlatformExecution.count({ where: { businessId, status: "RUNNING" } }),
  ]);

  return { total, completed, failed, running };
}
