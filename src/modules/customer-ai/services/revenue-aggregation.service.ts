import "server-only";

import { prisma } from "@/lib/prisma";

export type RevenuePeriod = "today" | "yesterday" | "week" | "month";

export interface RevenuePeriodSummary {
  period: RevenuePeriod;
  orderCount: number;
  revenueAmount: number;
  currency: string;
  revenueAvailable: boolean;
  definition: string;
}

export interface BusinessRevenueSnapshot {
  currency: string;
  revenueAvailable: boolean;
  definition: string;
  periods: RevenuePeriodSummary[];
}

const REVENUE_DEFINITION =
  "Sum of restaurant order total_amount where status is not CANCELLED and payment_status is PAID or PARTIALLY_PAID.";

const COUNTABLE_PAYMENT_STATUSES = ["PAID", "PARTIALLY_PAID"] as const;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function periodRange(period: RevenuePeriod, now = new Date()): { from: Date; to: Date } {
  switch (period) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "week":
      return { from: startOfWeek(now), to: endOfDay(now) };
    case "month":
      return { from: startOfMonth(now), to: endOfDay(now) };
  }
}

async function aggregateRevenueForPeriod(
  businessId: string,
  period: RevenuePeriod,
  currency: string,
): Promise<RevenuePeriodSummary> {
  const { from, to } = periodRange(period);

  const orders = await prisma.restaurantOrder.findMany({
    where: {
      businessId,
      placedAt: { gte: from, lte: to },
      status: { not: "CANCELLED" },
      paymentStatus: { in: [...COUNTABLE_PAYMENT_STATUSES] },
    },
    select: { totalAmount: true },
  });

  const revenueAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

  return {
    period,
    orderCount: orders.length,
    revenueAmount: Math.round(revenueAmount * 100) / 100,
    currency,
    revenueAvailable: true,
    definition: REVENUE_DEFINITION,
  };
}

export async function getBusinessRevenueSnapshot(
  businessId: string,
): Promise<BusinessRevenueSnapshot> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { currency: true },
  });

  const currency = business?.currency ?? "GBP";

  const hasOrderTable = await prisma.restaurantOrder
    .count({ where: { businessId }, take: 1 })
    .then(() => true)
    .catch(() => false);

  if (!hasOrderTable) {
    return {
      currency,
      revenueAvailable: false,
      definition: REVENUE_DEFINITION,
      periods: [],
    };
  }

  const periods = await Promise.all(
    (["today", "yesterday", "week", "month"] as RevenuePeriod[]).map((period) =>
      aggregateRevenueForPeriod(businessId, period, currency),
    ),
  );

  return {
    currency,
    revenueAvailable: true,
    definition: REVENUE_DEFINITION,
    periods,
  };
}

export async function getRevenueForPeriod(
  businessId: string,
  period: RevenuePeriod,
): Promise<RevenuePeriodSummary> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { currency: true },
  });
  return aggregateRevenueForPeriod(businessId, period, business?.currency ?? "GBP");
}
