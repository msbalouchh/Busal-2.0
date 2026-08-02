import "server-only";

import {
  getSalesDashboard,
  getCustomerAnalytics,
  getOrderAnalytics,
} from "@/services/reporting.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createMarketingInsight } from "@/services/ai-marketing-recommendation.service";
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
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getMarketingTrendSnapshot(ownerId);
  let created = 0;

  await createMarketingInsight(businessId, {
    title: "Weekly marketing summary",
    description: `Week revenue: £${(snapshot.revenueWeekPence / 100).toFixed(2)} · ${snapshot.newCustomers} new customers · ${snapshot.conversionIndicator}% repeat rate.`,
    category: "performance",
    priority: "MEDIUM",
    recommendation: "Review top-performing channels and double down on highest-ROI campaigns.",
    metadata: { snapshot },
  });
  created += 1;

  return created;
}

export async function generateConversionInsights(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getMarketingTrendSnapshot(ownerId);
  let created = 0;

  if (snapshot.conversionIndicator < 30) {
    await createMarketingInsight(businessId, {
      title: "Low conversion to repeat customers",
      description: `Only ${snapshot.conversionIndicator}% of engaged customers are returning.`,
      category: "conversion",
      priority: "HIGH",
      recommendation: "Implement post-purchase follow-up and first-order discount for next visit.",
      metadata: { conversionIndicator: snapshot.conversionIndicator },
    });
    created += 1;
  }

  return created;
}

export async function detectMarketingOpportunities(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const [snapshot, segments] = await Promise.all([
    getMarketingTrendSnapshot(ownerId),
    listCustomerSegments(ownerId),
  ]);

  const opportunities: Array<{
    id: string;
    title: string;
    type: string;
    priority: string;
    description: string;
  }> = [];

  if (snapshot.newCustomers > snapshot.returningCustomers) {
    opportunities.push({
      id: "acquisition-balance",
      title: "Balance acquisition with retention",
      type: "acquisition",
      priority: "MEDIUM",
      description: "New customers outpace returning — invest in onboarding campaigns.",
    });
  }

  const atRisk = segments.find((s) => s.slug === "at-risk");
  if (atRisk && atRisk.customerCount > 0) {
    opportunities.push({
      id: "retention-at-risk",
      title: "Retention opportunity",
      type: "retention",
      priority: "CRITICAL",
      description: `${atRisk.customerCount} customers at risk of churning.`,
    });
  }

  const topSegment = segments[0];
  if (topSegment && topSegment.customerCount > 0) {
    opportunities.push({
      id: `segment-${topSegment.slug}`,
      title: `Target ${topSegment.name} segment`,
      type: "segment",
      priority: "HIGH",
      description: `Highest LTV segment with ${topSegment.customerCount} customers.`,
    });
  }

  await createMarketingInsight(businessId, {
    title: "Marketing opportunities detected",
    description: `${opportunities.length} opportunities identified across acquisition, retention, and segments.`,
    category: "opportunity",
    priority: opportunities.some((o) => o.priority === "CRITICAL") ? "CRITICAL" : "HIGH",
    recommendation:
      "Prioritize at-risk retention campaigns before launching new acquisition spend.",
    metadata: { opportunities },
  });

  return opportunities;
}
