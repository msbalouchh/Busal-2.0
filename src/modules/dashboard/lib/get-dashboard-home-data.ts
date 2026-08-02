import "server-only";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { DashboardActivityItem, DashboardHomeData } from "@/modules/dashboard/types/dashboard";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import { moneyDecimalToPence } from "@/modules/payments/utils/currency";
import { getDateRangeForPeriod, getReportingDashboard } from "@/services/reporting.service";
import { getNotificationDashboard } from "@/services/notifications.service";

function formatPence(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export async function getDashboardHomeData(platform: BusinessContext): Promise<DashboardHomeData> {
  const businessId = platform.business.id;
  const branchId = platform.branchId;
  const todayRange = getDateRangeForPeriod("today");

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
    prisma.legacyOrder.findMany({
      where: {
        businessId,
        ...branchFilter(branchId),
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
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
    description: `${order.status} · ${formatPence(moneyDecimalToPence(order.total))}`,
    timestamp: order.createdAt.toISOString(),
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
}
