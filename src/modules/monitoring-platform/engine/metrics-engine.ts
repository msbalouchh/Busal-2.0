import type { MetricSnapshotInput } from "@/modules/monitoring-platform/types/monitoring-platform-types";

export interface AggregatedMetrics {
  avgCpuUsage: number;
  avgMemoryUsage: number;
  avgDiskUsage: number;
  avgNetworkUsage: number;
  totalDatabaseConnections: number;
  totalActiveSessions: number;
  totalQueueLength: number;
  totalBackgroundJobs: number;
  avgCacheHitRate: number;
  totalStorageUsageBytes: number;
}

export function normalizeMetricSnapshot(input: MetricSnapshotInput): Required<
  Omit<MetricSnapshotInput, "metadata" | "cacheHitRate" | "storageUsageBytes">
> & {
  cacheHitRate: number | null;
  storageUsageBytes: bigint | null;
} {
  return {
    snapshotKey: input.snapshotKey ?? `snapshot-${Date.now()}`,
    cpuUsage: input.cpuUsage ?? 0,
    memoryUsage: input.memoryUsage ?? 0,
    diskUsage: input.diskUsage ?? 0,
    networkUsage: input.networkUsage ?? 0,
    databaseConnections: input.databaseConnections ?? 0,
    activeSessions: input.activeSessions ?? 0,
    queueLength: input.queueLength ?? 0,
    backgroundJobs: input.backgroundJobs ?? 0,
    cacheHitRate: input.cacheHitRate ?? null,
    storageUsageBytes:
      input.storageUsageBytes !== undefined && input.storageUsageBytes !== null
        ? BigInt(input.storageUsageBytes)
        : null,
  };
}

export function aggregateMetrics(
  snapshots: Array<{
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkUsage: number;
    databaseConnections: number;
    activeSessions: number;
    queueLength: number;
    backgroundJobs: number;
    cacheHitRate: number | null;
    storageUsageBytes: bigint | null;
  }>,
): AggregatedMetrics {
  if (snapshots.length === 0) {
    return {
      avgCpuUsage: 0,
      avgMemoryUsage: 0,
      avgDiskUsage: 0,
      avgNetworkUsage: 0,
      totalDatabaseConnections: 0,
      totalActiveSessions: 0,
      totalQueueLength: 0,
      totalBackgroundJobs: 0,
      avgCacheHitRate: 0,
      totalStorageUsageBytes: 0,
    };
  }

  const count = snapshots.length;
  const cacheRates = snapshots
    .map((snapshot) => snapshot.cacheHitRate)
    .filter((rate): rate is number => rate !== null);

  return {
    avgCpuUsage: snapshots.reduce((sum, s) => sum + s.cpuUsage, 0) / count,
    avgMemoryUsage: snapshots.reduce((sum, s) => sum + s.memoryUsage, 0) / count,
    avgDiskUsage: snapshots.reduce((sum, s) => sum + s.diskUsage, 0) / count,
    avgNetworkUsage: snapshots.reduce((sum, s) => sum + s.networkUsage, 0) / count,
    totalDatabaseConnections: snapshots.reduce((sum, s) => sum + s.databaseConnections, 0),
    totalActiveSessions: snapshots.reduce((sum, s) => sum + s.activeSessions, 0),
    totalQueueLength: snapshots.reduce((sum, s) => sum + s.queueLength, 0),
    totalBackgroundJobs: snapshots.reduce((sum, s) => sum + s.backgroundJobs, 0),
    avgCacheHitRate:
      cacheRates.length === 0
        ? 0
        : cacheRates.reduce((sum, rate) => sum + rate, 0) / cacheRates.length,
    totalStorageUsageBytes: Number(
      snapshots.reduce((sum, s) => sum + (s.storageUsageBytes ?? BigInt(0)), BigInt(0)),
    ),
  };
}

export function shouldTriggerHighCpuAlert(cpuUsage: number, threshold = 85): boolean {
  return cpuUsage >= threshold;
}

export function shouldTriggerHighMemoryAlert(memoryUsage: number, threshold = 90): boolean {
  return memoryUsage >= threshold;
}
