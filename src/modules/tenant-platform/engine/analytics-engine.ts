import { calculateUsagePercentage } from "@/modules/tenant-platform/engine/limits-engine";
import type { TenantAnalyticsView } from "@/modules/tenant-platform/types/tenant-platform-types";
import type { TenantHealthStatus } from "@prisma/client";

export function buildTenantAnalytics(input: {
  activeUsers: number;
  maxUsers: number;
  storageUsedBytes: bigint | number;
  maxStorageBytes: bigint | number;
  apiCallsThisMonth: number;
  maxApiCallsPerMonth: number;
  aiTokensThisMonth: number;
  maxAiTokensPerMonth: number;
  loginActivityCount: number;
  fileCount: number;
  workflowCount: number;
  moduleUsage: Record<string, number>;
  subscriptionStatus: string;
  healthStatus: TenantHealthStatus;
}): TenantAnalyticsView {
  const storageUsed = Number(input.storageUsedBytes);
  const maxStorage = Number(input.maxStorageBytes);

  return {
    activeUsers: input.activeUsers,
    storageUsagePct: calculateUsagePercentage(storageUsed, maxStorage),
    apiUsagePct: calculateUsagePercentage(input.apiCallsThisMonth, input.maxApiCallsPerMonth),
    aiConsumptionPct: calculateUsagePercentage(input.aiTokensThisMonth, input.maxAiTokensPerMonth),
    loginActivityCount: input.loginActivityCount,
    fileCount: input.fileCount,
    workflowCount: input.workflowCount,
    moduleUsage: input.moduleUsage,
    subscriptionStatus: input.subscriptionStatus,
    healthStatus: input.healthStatus,
  };
}
