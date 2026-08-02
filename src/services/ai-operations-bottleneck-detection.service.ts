import "server-only";

import { getKitchenDashboardStats } from "@/services/restaurant-kitchen-display.service";
import { getOrderDashboardStats } from "@/services/restaurant-order.service";
import {
  createOperationInsight,
  createOperationRecommendation,
} from "@/services/ai-operations-efficiency-recommendation.service";
import { getOwnedBusinessId, getPrimaryBranchId } from "@/services/ai-operations-context.service";

export interface BottleneckAlert {
  id: string;
  area: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  metric: number;
  recommendation: string;
}

export async function detectOperationalBottlenecks(ownerId: string): Promise<BottleneckAlert[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const branchId = await getPrimaryBranchId(businessId);
  if (!branchId) return [];

  const [kitchen, orders] = await Promise.all([
    getKitchenDashboardStats(businessId, branchId),
    getOrderDashboardStats(businessId, branchId),
  ]);

  const alerts: BottleneckAlert[] = [];

  const queueDepth = kitchen.newCount + kitchen.acceptedCount + kitchen.preparingCount;
  if (queueDepth > 10) {
    alerts.push({
      id: "kitchen-queue",
      area: "Kitchen",
      description: `${queueDepth} orders in kitchen pipeline.`,
      severity: queueDepth > 20 ? "CRITICAL" : "HIGH",
      metric: queueDepth,
      recommendation: "Add kitchen capacity or pause new order intake temporarily.",
    });
  }

  if (kitchen.averagePrepMinutes > 25) {
    alerts.push({
      id: "slow-prep",
      area: "Kitchen prep",
      description: `Average prep time ${kitchen.averagePrepMinutes} minutes exceeds target.`,
      severity: "HIGH",
      metric: kitchen.averagePrepMinutes,
      recommendation: "Review prep station bottlenecks and simplify menu during rush.",
    });
  }

  if (orders.pendingToday > 8) {
    alerts.push({
      id: "order-pending",
      area: "Order intake",
      description: `${orders.pendingToday} orders awaiting confirmation.`,
      severity: orders.pendingToday > 15 ? "CRITICAL" : "MEDIUM",
      metric: orders.pendingToday,
      recommendation: "Ensure POS staff confirm orders promptly.",
    });
  }

  if (orders.unpaidToday > 5) {
    alerts.push({
      id: "unpaid-orders",
      area: "Payment flow",
      description: `${orders.unpaidToday} completed orders unpaid.`,
      severity: "MEDIUM",
      metric: orders.unpaidToday,
      recommendation: "Close out unpaid tabs before end of shift.",
    });
  }

  if (kitchen.priorityCount > 3) {
    alerts.push({
      id: "priority-queue",
      area: "Priority queue",
      description: `${kitchen.priorityCount} priority orders waiting.`,
      severity: "HIGH",
      metric: kitchen.priorityCount,
      recommendation: "Expedite priority orders to protect customer experience.",
    });
  }

  return alerts.sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[a.severity] - order[b.severity];
  });
}

export async function generateBottleneckInsights(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const bottlenecks = await detectOperationalBottlenecks(ownerId);
  let created = 0;

  if (bottlenecks.length > 0) {
    await createOperationInsight(businessId, {
      title: "Operational bottlenecks detected",
      description: `${bottlenecks.length} bottlenecks identified today.`,
      category: "bottleneck",
      priority: bottlenecks.some((b) => b.severity === "CRITICAL") ? "CRITICAL" : "HIGH",
      recommendation: bottlenecks.map((b) => b.area).join(", "),
      metadata: { count: bottlenecks.length },
    });
    created += 1;
  }

  for (const bottleneck of bottlenecks.slice(0, 3)) {
    await createOperationRecommendation(businessId, {
      title: `Resolve: ${bottleneck.area}`,
      description: bottleneck.description,
      action: bottleneck.recommendation,
      expectedImpact: "Reduced wait times and improved throughput",
      confidenceScore: bottleneck.severity === "CRITICAL" ? 0.9 : 0.75,
      metadata: { bottleneckId: bottleneck.id },
    });
    created += 1;
  }

  return created;
}
