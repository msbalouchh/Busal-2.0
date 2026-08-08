import "server-only";

import { prisma } from "@/lib/prisma";
import { featurePermissionService } from "@/modules/finance/feature-access/services/feature-permission.service";
import type { PlatformModuleKey } from "@/modules/finance/feature-access/constants/feature-registry";
import { permissionDenied } from "@/modules/platform-guards/utils/platform-guard-errors";
import type { UsageMetricKey } from "@/modules/commercial-foundation/services/usage-tracking.service";
import { usageTrackingService } from "@/modules/commercial-foundation/services/usage-tracking.service";

export interface LimitCheckResult {
  allowed: boolean;
  metric: UsageMetricKey;
  current: number;
  limit: number;
  message?: string;
}

/** Enforces commercial limits (seats, branches, storage, AI, API). */
export class CommercialLimitsService {
  async assertModuleEntitlement(businessId: string, moduleKey: PlatformModuleKey): Promise<void> {
    await featurePermissionService.assertModuleAccess(businessId, moduleKey);
  }

  async assertWithinLimit(businessId: string, metric: UsageMetricKey): Promise<LimitCheckResult> {
    const [limits, usage] = await Promise.all([
      prisma.tenantResourceLimit.findUnique({ where: { businessId } }),
      usageTrackingService.getUsageSummary(businessId),
    ]);

    if (!limits) {
      return { allowed: true, metric, current: usage[metric] ?? 0, limit: Number.MAX_SAFE_INTEGER };
    }

    const mapping: Record<UsageMetricKey, { current: number; limit: number }> = {
      ai_requests: { current: usage.ai_requests ?? 0, limit: limits.maxAiTokensPerMonth },
      api_requests: { current: usage.api_requests ?? 0, limit: limits.maxApiCallsPerMonth },
      storage_bytes: { current: usage.storage_bytes ?? 0, limit: Number(limits.maxStorageBytes) },
      branches: { current: usage.branches ?? 0, limit: limits.maxBranches },
      staff: { current: usage.staff ?? 0, limit: limits.maxUsers },
      orders: { current: usage.orders ?? 0, limit: Number.MAX_SAFE_INTEGER },
      reservations: { current: usage.reservations ?? 0, limit: Number.MAX_SAFE_INTEGER },
      pos_transactions: { current: usage.pos_transactions ?? 0, limit: Number.MAX_SAFE_INTEGER },
      crm_contacts: { current: usage.crm_contacts ?? 0, limit: Number.MAX_SAFE_INTEGER },
      notifications: { current: usage.notifications ?? 0, limit: Number.MAX_SAFE_INTEGER },
    };

    const check = mapping[metric];
    const allowed = check.current < check.limit;

    if (!allowed) {
      throw permissionDenied(`Commercial limit exceeded for ${metric}`);
    }

    return { allowed, metric, current: check.current, limit: check.limit };
  }

  async assertBranchLimit(businessId: string): Promise<void> {
    const branchCount = await prisma.branch.count({ where: { businessId, isActive: true } });
    const limits = await prisma.tenantResourceLimit.findUnique({ where: { businessId } });

    if (limits && branchCount >= limits.maxBranches) {
      throw permissionDenied("Branch limit reached for your subscription plan");
    }
  }

  async assertStaffLimit(businessId: string): Promise<void> {
    await this.assertWithinLimit(businessId, "staff");
  }
}

export const commercialLimitsService = new CommercialLimitsService();
