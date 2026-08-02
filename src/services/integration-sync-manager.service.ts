import "server-only";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/integration-context.service";
import { writeIntegrationLog } from "@/services/integration-logger.service";
import { dispatchIntegrationEvent } from "@/services/integration-event-dispatcher.service";

export async function listIntegrationSyncJobs(ownerId: string, connectionId?: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.integrationSyncJob.findMany({
    where: {
      businessId,
      ...(connectionId ? { connectionId } : {}),
    },
    include: {
      connection: {
        select: { displayName: true, provider: { select: { name: true, slug: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function triggerManualSync(ownerId: string, connectionId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const connection = await prisma.integrationConnection.findFirst({
    where: { id: connectionId, businessId },
  });
  if (!connection) throw new Error("Connection not found");

  const job = await prisma.integrationSyncJob.create({
    data: {
      businessId,
      connectionId,
      status: "RUNNING",
      startedAt: new Date(),
      attempts: 1,
    },
  });

  await dispatchIntegrationEvent("sync.started", { businessId, connectionId, jobId: job.id });
  await writeIntegrationLog(businessId, {
    connectionId,
    level: "INFO",
    message: "Manual sync started",
    metadata: { jobId: job.id },
  });

  await prisma.integrationSyncJob.update({
    where: { id: job.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  await prisma.integrationConnection.update({
    where: { id: connectionId },
    data: { lastSyncAt: new Date(), status: "ACTIVE" },
  });

  await dispatchIntegrationEvent("sync.completed", { businessId, connectionId, jobId: job.id });
  await writeIntegrationLog(businessId, {
    connectionId,
    level: "INFO",
    message: "Manual sync completed",
    metadata: { jobId: job.id },
  });

  return job;
}

export async function scheduleSyncJob(ownerId: string, connectionId: string, scheduledAt: Date) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.integrationSyncJob.create({
    data: {
      businessId,
      connectionId,
      status: "PENDING",
      scheduledAt,
    },
  });
}
