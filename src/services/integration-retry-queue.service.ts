import "server-only";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/integration-context.service";
import { writeIntegrationLog } from "@/services/integration-logger.service";
import { dispatchIntegrationEvent } from "@/services/integration-event-dispatcher.service";

function nextRetryDelayMs(attempts: number): number {
  return Math.min(60_000, 1000 * 2 ** attempts);
}

export async function retryFailedSyncJobs(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const failedJobs = await prisma.integrationSyncJob.findMany({
    where: {
      businessId,
      status: "FAILED",
    },
    take: 10,
  });

  let retried = 0;
  for (const job of failedJobs) {
    if (job.attempts >= job.maxAttempts) continue;

    await prisma.integrationSyncJob.update({
      where: { id: job.id },
      data: {
        status: "RUNNING",
        attempts: job.attempts + 1,
        startedAt: new Date(),
        scheduledAt: new Date(Date.now() + nextRetryDelayMs(job.attempts)),
        errorMessage: null,
      },
    });

    await prisma.integrationSyncJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    await writeIntegrationLog(businessId, {
      connectionId: job.connectionId,
      level: "INFO",
      message: `Sync job retried (attempt ${job.attempts + 1})`,
      metadata: { jobId: job.id },
    });

    await dispatchIntegrationEvent("sync.completed", {
      businessId,
      connectionId: job.connectionId,
      jobId: job.id,
    });

    retried += 1;
  }

  return retried;
}

export async function markSyncJobFailed(
  businessId: string,
  jobId: string,
  connectionId: string,
  errorMessage: string,
) {
  await prisma.integrationSyncJob.update({
    where: { id: jobId },
    data: { status: "FAILED", errorMessage, completedAt: new Date() },
  });
  await dispatchIntegrationEvent("sync.failed", { businessId, connectionId, jobId, errorMessage });
}
