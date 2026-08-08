import "server-only";

import {
  getSalesDashboard as getReportingSalesDashboard,
} from "@/services/reporting.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createSalesInsight } from "@/services/ai-sales-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";

export interface RevenueInsightSnapshot {
  grossRevenuePence: number;
  netRevenuePence: number;
  totalOrders: number;
  averageOrderValuePence: number;
  weekRevenuePence: number;
  monthRevenuePence: number;
  trendDirection: "up" | "down" | "flat";
  trendPercent: number;
}

export interface RevenueTrendPoint {
  label: string;
  revenuePence: number;
  orders: number;
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function getRevenueInsightSnapshot(ownerId: string): Promise<RevenueInsightSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const dashboard = await getReportingSalesDashboard(businessId);

  const weekRevenue = dashboard.periods.week.grossRevenuePence;
  const monthRevenue = dashboard.periods.month.grossRevenuePence;
  const todayRevenue = dashboard.periods.today.grossRevenuePence;

  let trendDirection: "up" | "down" | "flat" = "flat";
  let trendPercent = 0;

  if (weekRevenue > 0) {
    const dailyAvg = weekRevenue / 7;
    if (dailyAvg > 0) {
      trendPercent = Math.round(((todayRevenue - dailyAvg) / dailyAvg) * 100);
      trendDirection = trendPercent > 5 ? "up" : trendPercent < -5 ? "down" : "flat";
    }
  }

  return {
    grossRevenuePence: dashboard.grossRevenuePence,
    netRevenuePence: dashboard.netRevenuePence,
    totalOrders: dashboard.totalOrders,
    averageOrderValuePence: dashboard.averageOrderValuePence,
    weekRevenuePence: weekRevenue,
    monthRevenuePence: monthRevenue,
    trendDirection,
    trendPercent,
  };
}

export async function getRevenueTrendPoints(ownerId: string): Promise<RevenueTrendPoint[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const dashboard = await getReportingSalesDashboard(businessId);

  return [
    {
      label: "Today",
      revenuePence: dashboard.periods.today.grossRevenuePence,
      orders: dashboard.periods.today.totalOrders,
    },
    {
      label: "This week",
      revenuePence: dashboard.periods.week.grossRevenuePence,
      orders: dashboard.periods.week.totalOrders,
    },
    {
      label: "This month",
      revenuePence: dashboard.periods.month.grossRevenuePence,
      orders: dashboard.periods.month.totalOrders,
    },
    {
      label: "This year",
      revenuePence: dashboard.periods.year.grossRevenuePence,
      orders: dashboard.periods.year.totalOrders,
    },
  ];
}

export async function generateRevenueInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "sales",
    task: "revenue-insights",
    loadContext: getRevenueInsightSnapshot,
    persistInsight: (businessId, insight) =>
      createSalesInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "revenue",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}
