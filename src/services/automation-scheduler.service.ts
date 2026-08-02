import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/automation-context.service";
import { executeAutomationWorkflow } from "@/services/automation-execution-engine.service";

export async function scheduleAutomationWorkflow(
  ownerId: string,
  workflowId: string,
  scheduledAt: Date,
  input: Record<string, unknown> = {},
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const workflow = await prisma.automationPlatformWorkflow.findFirst({
    where: { id: workflowId, businessId, enabled: true },
  });
  if (!workflow) throw new Error("Active workflow not found");

  const execution = await prisma.automationPlatformExecution.create({
    data: {
      workflowId,
      businessId,
      status: "PENDING",
      input: {
        ...input,
        scheduledAt: scheduledAt.toISOString(),
      } as Prisma.InputJsonValue,
      metadata: {
        scheduled: true,
        scheduledAt: scheduledAt.toISOString(),
      } as Prisma.InputJsonValue,
    },
  });

  return execution;
}

export async function processDueScheduledExecutions(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const pending = await prisma.automationPlatformExecution.findMany({
    where: {
      businessId,
      status: "PENDING",
    },
    take: 20,
    orderBy: { startedAt: "asc" },
  });

  let processed = 0;
  for (const execution of pending) {
    const metadata = execution.metadata as Record<string, unknown>;
    if (!metadata.scheduled) continue;

    const scheduledAt = metadata.scheduledAt ? new Date(String(metadata.scheduledAt)) : null;
    if (scheduledAt && scheduledAt > new Date()) continue;

    await executeAutomationWorkflow(
      ownerId,
      execution.workflowId,
      execution.input as Record<string, unknown>,
    );
    processed += 1;
  }

  return processed;
}

export async function listScheduledExecutions(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.automationPlatformExecution.findMany({
    where: {
      businessId,
      status: "PENDING",
    },
    include: { workflow: { select: { name: true } } },
    orderBy: { startedAt: "asc" },
    take: 50,
  });
}
