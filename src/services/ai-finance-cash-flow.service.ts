import "server-only";

import { prisma } from "@/lib/prisma";
import { getRevopsDashboard, getRevenueAnalytics } from "@/services/revops.service";
import { getFinancialReport } from "@/services/reporting.service";
import { createFinanceInsight } from "@/services/ai-finance-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface CashFlowSnapshot {
  totalCollectedPence: number;
  outstandingPence: number;
  totalExpensesPence: number;
  netCashFlowPence: number;
  overdueInvoices: number;
  openCollections: number;
  paymentsByMethod: Array<{ method: string; totalPence: number; count: number }>;
  posRevenueMonthPence: number;
}

export async function getCashFlowSnapshot(ownerId: string): Promise<CashFlowSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const [revops, analytics, monthly] = await Promise.all([
    getRevopsDashboard(businessId),
    getRevenueAnalytics(businessId),
    getFinancialReport(businessId, "monthly"),
  ]);

  return {
    totalCollectedPence: revops.totalCollectedPence,
    outstandingPence: revops.outstandingPence,
    totalExpensesPence: revops.totalExpensesPence,
    netCashFlowPence: revops.totalCollectedPence - revops.totalExpensesPence,
    overdueInvoices: revops.overdueInvoices,
    openCollections: revops.openCollections,
    paymentsByMethod: analytics.paymentsByMethod,
    posRevenueMonthPence: monthly.netRevenuePence,
  };
}

export async function generateCashFlowInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "finance",
    task: "cash-flow-insights",
    loadContext: getCashFlowSnapshot,
    persistInsight: (businessId, insight) =>
      createFinanceInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "cash_flow",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}

export async function analyzePaymentTrends(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const payments = await prisma.orderPayment.groupBy({
    by: ["paymentMethod"],
    where: { businessId, status: "PAID", paidAt: { gte: monthStart } },
    _count: { _all: true },
    _sum: { amountPaid: true },
  });

  return payments.map((p) => ({
    method: p.paymentMethod,
    count: p._count._all,
    totalPence: Math.round(Number(p._sum.amountPaid ?? 0) * 100),
  }));
}

export async function generatePaymentInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "finance",
    task: "payment-insights",
    loadContext: async (ownerId) => ({ ownerId }),
    persistInsight: (businessId, insight) =>
      createFinanceInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "payment",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}
