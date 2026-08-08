import "server-only";

import {
  getSalesDashboard,
  getCustomerAnalytics,
  getOrderAnalytics,
} from "@/services/reporting.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createMarketingInsight } from "@/services/ai-marketing-recommendation.service";
import { runOwnerDomainDetectionTask, runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import { listCustomerSegments } from "@/services/ai-marketing-segmentation.service";

export interface MarketingTrendPoint {
  label: string;
  value: number;
  metric: string;
}

export interface MarketingTrendSnapshot {
  revenueTodayPence: number;
  revenueWeekPence: number;
  revenueMonthPence: number;
  newCustomers: number;
  returningCustomers: number;
  conversionIndicator: number;
  trends: MarketingTrendPoint[];
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function getMarketingTrendSnapshot(ownerId: string): Promise<MarketingTrendSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const [sales, customers, orders] = await Promise.all([
    getSalesDashboard(businessId),
    getCustomerAnalytics(businessId),
    getOrderAnalytics(businessId),
  ]);

  const totalOrders = orders.ordersByDay.reduce((sum, day) => sum + day.count, 0);
  const conversionIndicator =
    customers.newCustomers + customers.returningCustomers === 0
      ? 0
      : Math.round(
          (customers.returningCustomers / (customers.newCustomers + customers.returningCustomers)) *
            100,
        );

  return {
    revenueTodayPence: sales.periods.today.grossRevenuePence,
    revenueWeekPence: sales.periods.week.grossRevenuePence,
    revenueMonthPence: sales.periods.month.grossRevenuePence,
    newCustomers: customers.newCustomers,
    returningCustomers: customers.returningCustomers,
    conversionIndicator,
    trends: [
      { label: "Today revenue", value: sales.periods.today.grossRevenuePence, metric: "revenue" },
      { label: "Week revenue", value: sales.periods.week.grossRevenuePence, metric: "revenue" },
      { label: "Month revenue", value: sales.periods.month.grossRevenuePence, metric: "revenue" },
      { label: "New customers", value: customers.newCustomers, metric: "customers" },
      { label: "Returning customers", value: customers.returningCustomers, metric: "customers" },
      { label: "Orders (month)", value: totalOrders, metric: "orders" },
    ],
  };
}

export async function generateWeeklyMarketingSummary(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "marketing",
    task: "weekly-marketing-summary",
    loadContext: getMarketingTrendSnapshot,
    persistInsight: (businessId, insight) =>
      createMarketingInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "performance",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}

export async function generateConversionInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "marketing",
    task: "conversion-insights",
    loadContext: getMarketingTrendSnapshot,
    persistInsight: (businessId, insight) =>
      createMarketingInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "conversion",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}

export async function detectMarketingOpportunities(ownerId: string) {
  return runOwnerDomainDetectionTask<{
    id: string;
    title: string;
    type: string;
    priority: string;
    description: string;
  }>(ownerId, {
    module: "marketing",
    task: "marketing-opportunity-detection",
    responseKey: "opportunities",
    loadContext: async (id) => {
      const [snapshot, segments] = await Promise.all([
        getMarketingTrendSnapshot(id),
        listCustomerSegments(id),
      ]);
      return { snapshot, segments };
    },
  });
}
