import "server-only";

import { prisma } from "@/lib/prisma";
import { getRevopsDashboard, getRevenueAnalytics } from "@/services/revops.service";
import { getFinancialReport } from "@/services/reporting.service";
import { createFinanceInsight } from "@/services/ai-finance-recommendation.service";
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
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getCashFlowSnapshot(ownerId);
  let created = 0;

  await createFinanceInsight(businessId, {
    title: "Cash flow summary",
    description: `Net cash flow: £${(snapshot.netCashFlowPence / 100).toFixed(2)}. Outstanding receivables: £${(snapshot.outstandingPence / 100).toFixed(2)}.`,
    category: "cash_flow",
    priority: snapshot.netCashFlowPence < 0 ? "CRITICAL" : "MEDIUM",
    recommendation:
      snapshot.netCashFlowPence < 0
        ? "Negative cash flow — accelerate collections and defer non-essential spending."
        : "Maintain collection discipline and monitor outstanding invoices weekly.",
    metadata: { netCashFlowPence: snapshot.netCashFlowPence },
  });
  created += 1;

  if (snapshot.overdueInvoices > 0) {
    await createFinanceInsight(businessId, {
      title: "Overdue invoices impacting cash flow",
      description: `${snapshot.overdueInvoices} invoices are overdue.`,
      category: "invoice",
      priority: "HIGH",
      recommendation: "Follow up on overdue invoices and escalate open collection cases.",
      metadata: { overdueInvoices: snapshot.overdueInvoices },
    });
    created += 1;
  }

  return created;
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
  const businessId = await getOwnedBusinessId(ownerId);
  const trends = await analyzePaymentTrends(ownerId);
  let created = 0;

  if (trends.length > 0) {
    const top = trends.sort((a, b) => b.totalPence - a.totalPence)[0]!;
    await createFinanceInsight(businessId, {
      title: "Payment method analysis",
      description: `Primary payment method: ${top.method} (${top.count} transactions this month).`,
      category: "payment",
      priority: "LOW",
      recommendation: "Ensure payment processing fees align with your most-used methods.",
      metadata: { topMethod: top.method },
    });
    created += 1;
  }

  return created;
}
