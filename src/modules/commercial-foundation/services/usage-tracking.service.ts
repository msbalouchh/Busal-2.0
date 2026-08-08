import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type UsageMetricKey =
  | "ai_requests"
  | "api_requests"
  | "storage_bytes"
  | "branches"
  | "staff"
  | "orders"
  | "reservations"
  | "pos_transactions"
  | "crm_contacts"
  | "notifications";

export interface UsageIncrementInput {
  businessId: string;
  metric: UsageMetricKey;
  amount?: number;
}

/** Tracks per-business commercial usage against TenantResourceUsage. */
export class UsageTrackingService {
  async increment(input: UsageIncrementInput): Promise<void> {
    const amount = input.amount ?? 1;
    const usage = await prisma.tenantResourceUsage.findUnique({
      where: { businessId: input.businessId },
    });

    if (!usage) {
      await prisma.tenantResourceUsage.create({
        data: { businessId: input.businessId },
      });
    }

    const moduleUsage = await this.readModuleUsage(input.businessId);
    moduleUsage[input.metric] = (Number(moduleUsage[input.metric] ?? 0) + amount);

    switch (input.metric) {
      case "ai_requests":
        await prisma.tenantResourceUsage.update({
          where: { businessId: input.businessId },
          data: { aiTokensThisMonth: { increment: amount } },
        });
        break;
      case "api_requests":
        await prisma.tenantResourceUsage.update({
          where: { businessId: input.businessId },
          data: { apiCallsThisMonth: { increment: amount } },
        });
        break;
      case "storage_bytes":
        await prisma.tenantResourceUsage.update({
          where: { businessId: input.businessId },
          data: { storageUsedBytes: { increment: BigInt(amount) } },
        });
        break;
      case "staff":
        await prisma.tenantResourceUsage.update({
          where: { businessId: input.businessId },
          data: { activeUsers: { increment: amount } },
        });
        break;
      default:
        break;
    }

    await this.saveModuleUsage(input.businessId, moduleUsage);
  }

  async getUsageSummary(businessId: string): Promise<Record<string, number>> {
    const usage = await prisma.tenantResourceUsage.findUnique({
      where: { businessId },
    });

    const moduleUsage = await this.readModuleUsage(businessId);

    return {
      ai_requests: usage?.aiTokensThisMonth ?? Number(moduleUsage.ai_requests ?? 0),
      api_requests: usage?.apiCallsThisMonth ?? Number(moduleUsage.api_requests ?? 0),
      storage_bytes: Number(usage?.storageUsedBytes ?? 0),
      branches: Number(moduleUsage.branches ?? 0),
      staff: usage?.activeUsers ?? Number(moduleUsage.staff ?? 0),
      orders: Number(moduleUsage.orders ?? 0),
      reservations: Number(moduleUsage.reservations ?? 0),
      pos_transactions: Number(moduleUsage.pos_transactions ?? 0),
      crm_contacts: Number(moduleUsage.crm_contacts ?? 0),
      notifications: Number(moduleUsage.notifications ?? 0),
    };
  }

  private async readModuleUsage(businessId: string): Promise<Record<string, number>> {
    const usage = await prisma.tenantResourceUsage.findUnique({
      where: { businessId },
      select: { moduleUsage: true },
    });

    const raw = usage?.moduleUsage;
    if (raw && typeof raw === "object" && raw !== null) {
      return raw as Record<string, number>;
    }

    return {};
  }

  private async saveModuleUsage(businessId: string, moduleUsage: Record<string, number>): Promise<void> {
    await prisma.tenantResourceUsage.update({
      where: { businessId },
      data: {
        moduleUsage: moduleUsage as unknown as Prisma.InputJsonValue,
        lastCalculatedAt: new Date(),
      },
    });
  }
}

export const usageTrackingService = new UsageTrackingService();
