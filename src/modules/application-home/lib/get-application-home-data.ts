import "server-only";

import { prisma } from "@/lib/prisma";
import { requireBusinessContext } from "@/modules/business-context/services/business-context.service";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import {
  APPLICATION_HOME_FAVORITE_SHORTCUTS,
  APPLICATION_HOME_QUICK_ACTIONS,
} from "@/modules/application-home/constants/quick-actions";
import { RESERVATION_MANAGEMENT_ROUTES } from "@/modules/reservation-management/constants/routes";
import type {
  ApplicationHomeChartPoint,
  ApplicationHomeData,
} from "@/modules/application-home/types/application-home-types";
import {
  getTimeOfDayGreeting,
  resolveBusinessName,
  resolveDisplayName,
} from "@/modules/dashboard/lib/dashboard-display";
import { getDashboardHomeData } from "@/modules/dashboard/lib/get-dashboard-home-data";
import type { DashboardHomeStats } from "@/modules/dashboard/types/dashboard";
import { moneyDecimalToPence } from "@/modules/payments/utils/currency";
import { getDateRangeForPeriod, getProductAnalytics } from "@/services/reporting.service";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function formatCurrencyPence(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

function buildHeroSummary(stats: DashboardHomeStats): string {
  const parts: string[] = [];

  if (stats.todayOrders > 0) {
    parts.push(
      `${stats.todayOrders} orders today generating ${formatCurrencyPence(stats.todayRevenuePence)} in revenue`,
    );
  } else {
    parts.push("Your workspace is ready — activity will appear here as orders come in");
  }

  if (stats.todayReservations > 0) {
    parts.push(`${stats.todayReservations} reservations scheduled for today`);
  }

  if (stats.inventoryAlerts > 0) {
    parts.push(`${stats.inventoryAlerts} inventory alerts need review`);
  }

  return `${parts.join(". ")}.`;
}

function buildAiInsights(stats: DashboardHomeStats): string[] {
  const insights: string[] = [];

  if (stats.todayRevenuePence > 0) {
    insights.push(
      `Today's revenue is ${formatCurrencyPence(stats.todayRevenuePence)} across ${stats.todayOrders} completed orders.`,
    );
  }

  if (stats.totalCustomers > 0) {
    insights.push(
      `Your customer base includes ${stats.totalCustomers.toLocaleString("en-GB")} profiles.`,
    );
  }

  if (stats.inventoryAlerts > 0) {
    insights.push(
      `${stats.inventoryAlerts} inventory items are low or out of stock — review replenishment priorities.`,
    );
  } else {
    insights.push("Inventory levels are stable with no critical stock alerts.");
  }

  if (stats.unreadNotifications > 0) {
    insights.push(`You have ${stats.unreadNotifications} unread notifications in your inbox.`);
  }

  return insights.slice(0, 3);
}

function computeBusinessHealthScore(stats: DashboardHomeStats): number {
  let score = 50;

  if (stats.todayOrders > 0) score += 15;
  if (stats.todayRevenuePence > 0) score += 15;
  if (stats.inventoryAlerts === 0) score += 10;
  else if (stats.inventoryAlerts <= 3) score += 5;
  else if (stats.inventoryAlerts > 5) score -= 15;
  else score -= 5;
  if (stats.staffOnline > 0) score += 5;
  if (stats.unreadNotifications > 10) score -= 5;

  return Math.max(0, Math.min(100, score));
}

async function getWeeklyTrends(
  businessId: string,
  branchId: string | null,
): Promise<{
  revenueTrend: ApplicationHomeChartPoint[];
  ordersTrend: ApplicationHomeChartPoint[];
}> {
  const range = getDateRangeForPeriod("week");
  const orders = await prisma.restaurantOrder.findMany({
    where: {
      businessId,
      ...branchFilter(branchId),
      status: "COMPLETED",
      completedAt: { gte: range.from, lte: range.to },
    },
    select: { totalAmount: true, completedAt: true, placedAt: true },
  });

  const revenueTrend = DAY_LABELS.map((day) => ({ day, amount: 0 }));
  const ordersTrend = DAY_LABELS.map((day) => ({ day, count: 0 }));

  for (const order of orders) {
    const orderDate = order.completedAt ?? order.placedAt;
    const jsDay = orderDate.getDay();
    const index = jsDay === 0 ? 6 : jsDay - 1;
    ordersTrend[index]!.count = (ordersTrend[index]!.count ?? 0) + 1;
    revenueTrend[index]!.amount =
      (revenueTrend[index]!.amount ?? 0) + moneyDecimalToPence(order.totalAmount) / 100;
  }

  return { revenueTrend, ordersTrend };
}

async function getCustomerGrowthTrend(businessId: string): Promise<ApplicationHomeChartPoint[]> {
  const range = getDateRangeForPeriod("week");
  const customers = await prisma.customer.findMany({
    where: {
      businessId,
      deletedAt: null,
      createdAt: { gte: range.from, lte: range.to },
    },
    select: { createdAt: true },
  });

  const trend = DAY_LABELS.map((day) => ({ day, count: 0 }));

  for (const customer of customers) {
    const jsDay = customer.createdAt.getDay();
    const index = jsDay === 0 ? 6 : jsDay - 1;
    trend[index]!.count = (trend[index]!.count ?? 0) + 1;
  }

  return trend;
}

export async function getApplicationHomeData(): Promise<ApplicationHomeData> {
  const platform = await requireBusinessContext();
  const businessId = platform.business.id;
  const branchId = platform.branchId;
  const now = new Date();

  const [homeData, weeklyTrends, customerGrowth, topProducts, todayReservations] =
    await Promise.all([
      getDashboardHomeData(platform),
      getWeeklyTrends(businessId, branchId),
      getCustomerGrowthTrend(businessId),
      getProductAnalytics(businessId, getDateRangeForPeriod("week"), branchId),
      prisma.reservation.findMany({
        where: {
          businessId,
          ...branchFilter(branchId),
          reservationDate: {
            gte: getDateRangeForPeriod("today", now).from,
            lte: getDateRangeForPeriod("today", now).to,
          },
        },
        orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
        take: 6,
        select: {
          id: true,
          guestName: true,
          partySize: true,
          startTime: true,
          branchId: true,
        },
      }),
    ]);

  const ownerName = resolveDisplayName(platform.business.ownerName, platform.user.fullName);
  const businessName = resolveBusinessName(platform.business.businessName);
  const stats = homeData.stats;

  return {
    hero: {
      greeting: getTimeOfDayGreeting(now),
      ownerName,
      businessName,
      todayLabel: now.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      summary: buildHeroSummary(stats),
    },
    homeData,
    revenueTrend: weeklyTrends.revenueTrend,
    ordersTrend: weeklyTrends.ordersTrend,
    customerGrowth,
    topProducts: topProducts.bestSelling.slice(0, 5).map((item) => ({
      name: item.name,
      quantitySold: item.quantitySold,
      revenuePence: item.revenuePence,
    })),
    businessHealthScore: computeBusinessHealthScore(stats),
    quickActions: [...APPLICATION_HOME_QUICK_ACTIONS],
    favoriteShortcuts: [...APPLICATION_HOME_FAVORITE_SHORTCUTS],
    aiInsights: buildAiInsights(stats),
    aiSummary: buildHeroSummary(stats),
    todaySchedule: todayReservations.map((reservation) => ({
      id: reservation.id,
      title: `${reservation.guestName} · party of ${reservation.partySize}`,
      time: reservation.startTime,
      href: RESERVATION_MANAGEMENT_ROUTES.details(reservation.id, reservation.branchId),
    })),
  };
}
