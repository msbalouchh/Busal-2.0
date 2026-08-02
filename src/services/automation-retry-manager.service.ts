import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/automation-context.service";
import { executeAutomationWorkflow } from "@/services/automation-execution-engine.service";

const MAX_RETRY_ATTEMPTS = 3;

export async function retryFailedExecutions(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const failed = await prisma.automationPlatformExecution.findMany({
    where: { businessId, status: "FAILED" },
    orderBy: { completedAt: "desc" },
    take: 20,
  });

  let retried = 0;
  for (const execution of failed) {
    const metadata = execution.metadata as Record<string, unknown>;
    const attempts = Number(metadata.retryAttempts ?? 0);
    if (attempts >= MAX_RETRY_ATTEMPTS) continue;

    await prisma.automationPlatformExecution.update({
      where: { id: execution.id },
      data: {
        metadata: {
          ...metadata,
          retryAttempts: attempts + 1,
          lastRetryAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    await executeAutomationWorkflow(
      ownerId,
      execution.workflowId,
      execution.input as Record<string, unknown>,
    );
    retried += 1;
  }

  return retried;
}

export async function retryAutomationExecution(ownerId: string, executionId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const execution = await prisma.automationPlatformExecution.findFirst({
    where: { id: executionId, businessId, status: "FAILED" },
  });
  if (!execution) throw new Error("Failed execution not found");

  const metadata = execution.metadata as Record<string, unknown>;
  const attempts = Number(metadata.retryAttempts ?? 0);
  if (attempts >= MAX_RETRY_ATTEMPTS) {
    throw new Error("Maximum retry attempts reached");
  }

  await prisma.automationPlatformExecution.update({
    where: { id: executionId },
    data: {
      metadata: {
        ...metadata,
        retryAttempts: attempts + 1,
        lastRetryAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });

  return executeAutomationWorkflow(
    ownerId,
    execution.workflowId,
    execution.input as Record<string, unknown>,
  );
}
