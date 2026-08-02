import "server-only";

import { getCloudBusinessId } from "@/services/cloud-platform-context.service";

export interface BillingRecord {
  id: string;
  tenantId: string;
  amount: number;
  currency: string;
  status: "simulated" | "pending" | "paid";
  period: string;
  createdAt: Date;
}

export async function generateBillingRecord(ownerId: string): Promise<BillingRecord | null> {
  const businessId = await getCloudBusinessId(ownerId);
  const { prisma } = await import("@/lib/prisma");
  const tenant = await prisma.platformCloudTenant.findUnique({
    where: { businessId },
    include: { plan: true },
  });
  if (!tenant?.plan) return null;

  return {
    id: `bill-${tenant.id}-${Date.now()}`,
    tenantId: tenant.id,
    amount: tenant.plan.price,
    currency: "GBP",
    status: "simulated",
    period: tenant.plan.billingCycle.toLowerCase(),
    createdAt: new Date(),
  };
}

export async function listBillingFrameworkRecords(ownerId: string): Promise<BillingRecord[]> {
  const record = await generateBillingRecord(ownerId);
  return record ? [record] : [];
}

export function validateBillingFramework(): { ready: boolean; gateways: string[] } {
  return {
    ready: true,
    gateways: [],
  };
}
