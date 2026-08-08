import "server-only";

import { getFinancialReport, getSalesDashboard } from "@/services/reporting.service";
import { getRevopsDashboard } from "@/services/revops.service";
import { createFinanceInsight } from "@/services/ai-finance-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface RevenueSnapshot {
  grossRevenueMonthPence: number;
  netRevenueMonthPence: number;
  revenueTodayPence: number;
  revenueWeekPence: number;
  totalInvoicedPence: number;
  totalCollectedPence: number;
  totalOrders: number;
  discountPence: number;
}

export async function getRevenueSnapshot(ownerId: string): Promise<RevenueSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const [monthly, sales, revops] = await Promise.all([
    getFinancialReport(businessId, "monthly"),
    getSalesDashboard(businessId),
    getRevopsDashboard(businessId),
  ]);

  return {
    grossRevenueMonthPence: monthly.grossRevenuePence,
    netRevenueMonthPence: monthly.netRevenuePence,
    revenueTodayPence: sales.periods.today.grossRevenuePence,
    revenueWeekPence: sales.periods.week.grossRevenuePence,
    totalInvoicedPence: revops.totalInvoicedPence,
    totalCollectedPence: revops.totalCollectedPence,
    totalOrders: monthly.totalOrders,
    discountPence: monthly.discountPence,
  };
}

export async function generateRevenueInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "finance",
    task: "revenue-insights",
    loadContext: getRevenueSnapshot,
    persistInsight: (businessId, insight) =>
      createFinanceInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "revenue",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}
