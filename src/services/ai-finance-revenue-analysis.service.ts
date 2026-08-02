import "server-only";

import { getFinancialReport, getSalesDashboard } from "@/services/reporting.service";
import { getRevopsDashboard } from "@/services/revops.service";
import { createFinanceInsight } from "@/services/ai-finance-recommendation.service";
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
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getRevenueSnapshot(ownerId);
  let created = 0;

  if (snapshot.grossRevenueMonthPence > 0) {
    await createFinanceInsight(businessId, {
      title: "Monthly revenue summary",
      description: `Gross revenue this month: £${(snapshot.grossRevenueMonthPence / 100).toFixed(2)} across ${snapshot.totalOrders} orders.`,
      category: "revenue",
      priority: "MEDIUM",
      recommendation:
        "Compare against prior month and investigate discount impact if margins are shrinking.",
      metadata: { grossRevenuePence: snapshot.grossRevenueMonthPence },
    });
    created += 1;
  }

  if (snapshot.discountPence > snapshot.grossRevenueMonthPence * 0.1) {
    await createFinanceInsight(businessId, {
      title: "High discount rate detected",
      description: `Discounts represent over 10% of gross revenue (£${(snapshot.discountPence / 100).toFixed(2)}).`,
      category: "revenue",
      priority: "HIGH",
      recommendation: "Review discount policies and promotion effectiveness.",
      metadata: { discountPence: snapshot.discountPence },
    });
    created += 1;
  }

  return created;
}
