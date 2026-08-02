import "server-only";

import {
  getSalesDashboard as getReportingSalesDashboard,
  getProductAnalytics,
} from "@/services/reporting.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createSalesInsight } from "@/services/ai-sales-recommendation.service";

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
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getRevenueInsightSnapshot(ownerId);
  let created = 0;

  await createSalesInsight(businessId, {
    title: "Today's revenue summary",
    description: `Gross revenue today: £${(snapshot.grossRevenuePence / 100).toFixed(2)} across ${snapshot.totalOrders} orders.`,
    category: "revenue",
    priority: snapshot.totalOrders === 0 ? "HIGH" : "MEDIUM",
    recommendation:
      snapshot.totalOrders === 0
        ? "No orders recorded today. Review promotions or follow up with pending leads."
        : `Average order value is £${(snapshot.averageOrderValuePence / 100).toFixed(2)}.`,
    metadata: { snapshot },
  });
  created += 1;

  if (snapshot.trendDirection === "down") {
    await createSalesInsight(businessId, {
      title: "Revenue trend declining",
      description: `Today's revenue is ${Math.abs(snapshot.trendPercent)}% below the weekly daily average.`,
      category: "revenue",
      priority: "HIGH",
      recommendation: "Review pipeline activity and prioritize follow-ups on open opportunities.",
      metadata: { trendDirection: snapshot.trendDirection, trendPercent: snapshot.trendPercent },
    });
    created += 1;
  }

  const productAnalytics = await getProductAnalytics(businessId);
  const topRevenue = productAnalytics.topRevenueItems.slice(0, 3);

  if (topRevenue.length > 0) {
    await createSalesInsight(businessId, {
      title: "Top revenue products",
      description: `Highest revenue products: ${topRevenue.map((p) => p.name).join(", ")}.`,
      category: "products",
      priority: "MEDIUM",
      recommendation: "Consider upselling these products to returning customers.",
      metadata: { items: topRevenue.map((p) => ({ id: p.menuItemId, name: p.name })) },
    });
    created += 1;
  }

  return created;
}
