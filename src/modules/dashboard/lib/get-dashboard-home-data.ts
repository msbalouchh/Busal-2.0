import "server-only";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import type { DashboardActivityItem, DashboardHomeData } from "@/modules/dashboard/types/dashboard";
import { moneyDecimalToPence } from "@/modules/payments/utils/currency";
import { getDateRangeForPeriod, getReportingDashboard } from "@/services/reporting.service";
import { getNotificationDashboard } from "@/services/notifications.service";

function formatPence(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

function createEmptyDashboardHomeData(platform: BusinessContext): DashboardHomeData {
  return {
    stats: {
      businessName: platform.business.businessName?.trim() || "Your business",
      todayRevenuePence: 0,
      todayOrders: 0,
      todayReservations: 0,
      totalCustomers: 0,
      staffOnline: 0,
      inventoryAlerts: 0,
      unreadNotifications: 0,
    },
    recentActivity: [],
    recentNotifications: [],
    upcomingTasks: [],
  };
}

export async function getDashboardHomeData(platform: BusinessContext): Promise<DashboardHomeData> {
  const businessId = platform.business.id;
  const branchId = platform.branchId;
  const todayRange = getDateRangeForPeriod("today");

  try {
    const [
      reporting,
      notificationMetrics,
      reservationCount,
      staffOnline,
      recentOrders,
      recentInbox,
      upcomingTasks,
    ] = await Promise.all([
    getReportingDashboard(businessId, branchId),
    getNotificationDashboard(businessId),
    prisma.reservation.count({
      where: {
        businessId,
        ...branchFilter(branchId),
        reservationDate: {
          gte: todayRange.from,
          lte: todayRange.to,
        },
      },
    }),
    prisma.staff.count({
      where: {
        businessId,
        isActive: true,
        ...branchFilter(branchId),
      },
    }),
    prisma.restaurantOrder.findMany({
      where: {
        businessId,
        ...branchFilter(branchId),
      },
      orderBy: { placedAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        placedAt: true,
      },
    }),
    prisma.notificationInboxItem.findMany({
      where: { businessId, userId: platform.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        notification: {
          select: {
            title: true,
            body: true,
          },
        },
      },
    }),
    prisma.customerSuccessTask.findMany({
      where: {
        profile: { businessId },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        dueAt: true,
        status: true,
      },
    }),
  ]);

    const recentActivity: DashboardActivityItem[] = recentOrders.map((order) => ({
      id: order.id,
      title: `Order #${order.orderNumber}`,
      description: `${order.status} · ${formatPence(moneyDecimalToPence(order.totalAmount))}`,
      timestamp: order.placedAt.toISOString(),
      href: `/dashboard/reporting/orders`,
    }));

    return {
      stats: {
        businessName: platform.business.businessName?.trim() || "Your business",
        todayRevenuePence: reporting.sales.periods.today.grossRevenuePence,
        todayOrders: reporting.sales.periods.today.totalOrders,
        todayReservations: reservationCount,
        totalCustomers: reporting.customers.newCustomers + reporting.customers.returningCustomers,
        staffOnline,
        inventoryAlerts: reporting.inventory.lowStockCount + reporting.inventory.outOfStockCount,
        unreadNotifications: notificationMetrics.unreadInbox,
      },
      recentActivity,
      recentNotifications: recentInbox.map((item) => ({
        id: item.id,
        title: item.notification.title,
        body: item.notification.body,
        createdAt: item.createdAt.toISOString(),
        status: item.status,
      })),
      upcomingTasks: upcomingTasks.map((task) => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueAt?.toISOString() ?? null,
        status: task.status,
      })),
    };
  } catch (error) {
    console.error("[dashboard] Failed to load home data", error);
    return createEmptyDashboardHomeData(platform);
  }
}
