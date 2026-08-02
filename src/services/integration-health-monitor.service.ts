import "server-only";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/integration-context.service";

export interface IntegrationHealthSnapshot {
  totalProviders: number;
  activeConnections: number;
  errorConnections: number;
  disconnectedConnections: number;
  activeWebhooks: number;
  pendingSyncJobs: number;
  failedSyncJobs: number;
  recentErrors: number;
  healthScore: number;
  healthLabel: string;
}

export async function getIntegrationHealthSnapshot(
  ownerId: string,
): Promise<IntegrationHealthSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);

  const [
    totalProviders,
    connectionCounts,
    activeWebhooks,
    pendingSyncJobs,
    failedSyncJobs,
    recentErrors,
  ] = await Promise.all([
    prisma.integrationProvider.count({ where: { businessId } }),
    prisma.integrationConnection.groupBy({
      by: ["status"],
      where: { businessId },
      _count: { _all: true },
    }),
    prisma.integrationWebhook.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.integrationSyncJob.count({ where: { businessId, status: "PENDING" } }),
    prisma.integrationSyncJob.count({ where: { businessId, status: "FAILED" } }),
    prisma.integrationLog.count({
      where: {
        businessId,
        level: "ERROR",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const activeConnections =
    connectionCounts.find((row) => row.status === "ACTIVE")?._count._all ?? 0;
  const errorConnections = connectionCounts.find((row) => row.status === "ERROR")?._count._all ?? 0;
  const disconnectedConnections =
    connectionCounts.find((row) => row.status === "DISCONNECTED")?._count._all ?? 0;

  let healthScore = 85;
  healthScore -= errorConnections * 15;
  healthScore -= disconnectedConnections * 10;
  healthScore -= failedSyncJobs * 5;
  healthScore -= Math.min(20, recentErrors * 2);
  healthScore = Math.max(0, Math.min(100, healthScore));

  const healthLabel =
    healthScore >= 80
      ? "Healthy"
      : healthScore >= 60
        ? "Fair"
        : healthScore >= 40
          ? "Degraded"
          : "Critical";

  return {
    totalProviders,
    activeConnections,
    errorConnections,
    disconnectedConnections,
    activeWebhooks,
    pendingSyncJobs,
    failedSyncJobs,
    recentErrors,
    healthScore,
    healthLabel,
  };
}

export async function getIntegrationDashboardSummary(ownerId: string) {
  const [health, providers, connections, webhooks, syncJobs, logs] = await Promise.all([
    getIntegrationHealthSnapshot(ownerId),
    listProvidersSummary(ownerId),
    listConnectionsSummary(ownerId),
    listWebhooksSummary(ownerId),
    listSyncJobsSummary(ownerId),
    listRecentLogsSummary(ownerId),
  ]);

  return { health, providers, connections, webhooks, syncJobs, logs };
}

async function listProvidersSummary(ownerId: string) {
  const { listIntegrationProviders } = await import("@/services/integration-registry.service");
  const items = await listIntegrationProviders(ownerId);
  return { total: items.length, items: items.slice(0, 6) };
}

async function listConnectionsSummary(ownerId: string) {
  const { listIntegrationConnections } =
    await import("@/services/integration-connection-manager.service");
  const items = await listIntegrationConnections(ownerId);
  return { total: items.length, items: items.slice(0, 5) };
}

async function listWebhooksSummary(ownerId: string) {
  const { listIntegrationWebhooks } =
    await import("@/services/integration-webhook-manager.service");
  const items = await listIntegrationWebhooks(ownerId);
  return { total: items.length, items: items.slice(0, 5) };
}

async function listSyncJobsSummary(ownerId: string) {
  const { listIntegrationSyncJobs } = await import("@/services/integration-sync-manager.service");
  const items = await listIntegrationSyncJobs(ownerId);
  return { total: items.length, items: items.slice(0, 5) };
}

async function listRecentLogsSummary(ownerId: string) {
  const { listIntegrationLogs } = await import("@/services/integration-logger.service");
  const items = await listIntegrationLogs(ownerId, { limit: 5 });
  return { total: items.length, items };
}
