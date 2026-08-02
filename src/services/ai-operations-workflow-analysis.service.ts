import "server-only";

import {
  getOrdersDashboard,
  getKitchenDashboard,
  getReservationsDashboard,
} from "@/services/restaurant-analytics.service";
import { getOrderDashboardStats } from "@/services/restaurant-order.service";
import { createOperationInsight } from "@/services/ai-operations-efficiency-recommendation.service";
import {
  defaultAnalyticsFilters,
  getOwnedBusinessId,
  getPrimaryBranchId,
} from "@/services/ai-operations-context.service";

export interface WorkflowSnapshot {
  totalOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  peakHour: string | null;
  ordersByStatus: Array<{ status: string; count: number }>;
  avgFulfillmentBlocked: number;
}

export async function getWorkflowSnapshot(ownerId: string): Promise<WorkflowSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const branchId = await getPrimaryBranchId(businessId);
  const filters = defaultAnalyticsFilters(branchId);

  const [ordersDash, orderStats] = await Promise.all([
    getOrdersDashboard(ownerId, filters),
    branchId ? getOrderDashboardStats(businessId, branchId) : null,
  ]);

  const peak = ordersDash.ordersByHour.reduce(
    (best, point) => (point.value > (best?.value ?? 0) ? point : best),
    ordersDash.ordersByHour[0] ?? null,
  );

  return {
    totalOrders: Number(ordersDash.kpis[0]?.value ?? 0),
    cancelledOrders: ordersDash.cancelledOrders,
    pendingOrders: orderStats?.pendingToday ?? 0,
    peakHour: peak?.label ?? null,
    ordersByStatus: [],
    avgFulfillmentBlocked: orderStats?.preparingToday ?? 0,
  };
}

export async function generateWorkflowInsights(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getWorkflowSnapshot(ownerId);
  let created = 0;

  if (snapshot.pendingOrders > 5) {
    await createOperationInsight(businessId, {
      title: "Order workflow backlog",
      description: `${snapshot.pendingOrders} orders pending fulfillment.`,
      category: "workflow",
      priority: snapshot.pendingOrders > 15 ? "CRITICAL" : "HIGH",
      recommendation: "Prioritize pending orders and reallocate kitchen staff to clear the queue.",
      metadata: { pendingOrders: snapshot.pendingOrders },
    });
    created += 1;
  }

  if (snapshot.peakHour) {
    await createOperationInsight(businessId, {
      title: "Peak order hour identified",
      description: `Busiest hour today: ${snapshot.peakHour}.`,
      category: "workflow",
      priority: "MEDIUM",
      recommendation: "Staff up before peak hour and prep high-volume items in advance.",
      metadata: { peakHour: snapshot.peakHour },
    });
    created += 1;
  }

  if (snapshot.cancelledOrders > 0) {
    await createOperationInsight(businessId, {
      title: "Order cancellation rate",
      description: `${snapshot.cancelledOrders} orders cancelled in the current period.`,
      category: "order",
      priority: snapshot.cancelledOrders > 5 ? "HIGH" : "MEDIUM",
      recommendation: "Review cancellation reasons and improve order accuracy.",
      metadata: { cancelledOrders: snapshot.cancelledOrders },
    });
    created += 1;
  }

  const branchId = await getPrimaryBranchId(businessId);
  if (branchId) {
    const kitchen = await getKitchenDashboard(ownerId, defaultAnalyticsFilters(branchId));
    if (kitchen.averagePrepMinutes != null && kitchen.averagePrepMinutes > 20) {
      await createOperationInsight(businessId, {
        title: "Slow kitchen workflow",
        description: `Average prep time: ${kitchen.averagePrepMinutes} minutes.`,
        category: "workflow",
        priority: "HIGH",
        recommendation: "Review kitchen station assignments and prep workflows.",
        metadata: { avgPrepMinutes: kitchen.averagePrepMinutes },
      });
      created += 1;
    }
  }

  const reservations = await getReservationsDashboard(ownerId, defaultAnalyticsFilters(branchId));
  const noShowStatus = reservations.byStatus.find((s) => s.label === "NO_SHOW");
  if (noShowStatus && noShowStatus.value > 0) {
    await createOperationInsight(businessId, {
      title: "Reservation no-shows affecting operations",
      description: `${noShowStatus.value} no-show reservations detected.`,
      category: "reservation",
      priority: "MEDIUM",
      recommendation: "Implement confirmation reminders and overbooking strategy.",
      metadata: { noShows: noShowStatus.value },
    });
    created += 1;
  }

  return created;
}
