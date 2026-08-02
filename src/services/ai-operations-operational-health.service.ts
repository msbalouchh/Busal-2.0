import "server-only";

import { createOperationInsight } from "@/services/ai-operations-efficiency-recommendation.service";
import { getWorkflowSnapshot } from "@/services/ai-operations-workflow-analysis.service";
import { getResourceUtilizationSnapshot } from "@/services/ai-operations-resource-optimization.service";
import { getInventoryHealthSnapshot } from "@/services/ai-operations-inventory-health.service";
import { detectOperationalBottlenecks } from "@/services/ai-operations-bottleneck-detection.service";
import { getCapacitySnapshot } from "@/services/ai-operations-capacity-planning.service";
import { getOwnedBusinessId } from "@/services/ai-operations-context.service";

export interface OperationalHealthSnapshot {
  healthScore: number;
  healthLabel: string;
  utilizationRate: number;
  bottleneckCount: number;
  lowStockCount: number;
  pendingOrders: number;
  capacityUtilization: number;
}

export function computeOperationalHealthScore(input: {
  utilizationRate: number;
  bottleneckCount: number;
  lowStockCount: number;
  pendingOrders: number;
  cancelledOrders: number;
  capacityUtilization: number;
}): { score: number; label: string } {
  let score = 70;
  score += Math.min(15, input.utilizationRate / 5);
  score -= input.bottleneckCount * 8;
  score -= Math.min(20, input.lowStockCount * 4);
  score -= Math.min(15, input.pendingOrders * 2);
  score -= Math.min(10, input.cancelledOrders * 2);
  if (input.capacityUtilization > 95) score -= 10;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs attention";

  return { score, label };
}

export async function getOperationalHealthSnapshot(
  ownerId: string,
): Promise<OperationalHealthSnapshot> {
  const [workflow, resources, inventory, bottlenecks, capacity] = await Promise.all([
    getWorkflowSnapshot(ownerId),
    getResourceUtilizationSnapshot(ownerId),
    getInventoryHealthSnapshot(ownerId),
    detectOperationalBottlenecks(ownerId),
    getCapacitySnapshot(ownerId),
  ]);

  const health = computeOperationalHealthScore({
    utilizationRate: resources.utilizationRate,
    bottleneckCount: bottlenecks.length,
    lowStockCount: inventory.lowStockCount,
    pendingOrders: workflow.pendingOrders,
    cancelledOrders: workflow.cancelledOrders,
    capacityUtilization: capacity.capacityUtilization,
  });

  return {
    healthScore: health.score,
    healthLabel: health.label,
    utilizationRate: resources.utilizationRate,
    bottleneckCount: bottlenecks.length,
    lowStockCount: inventory.lowStockCount,
    pendingOrders: workflow.pendingOrders,
    capacityUtilization: capacity.capacityUtilization,
  };
}

export async function generateOperationalHealthInsights(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getOperationalHealthSnapshot(ownerId);
  let created = 0;

  await createOperationInsight(businessId, {
    title: "Operational health score",
    description: `Health: ${snapshot.healthScore}% (${snapshot.healthLabel}). ${snapshot.bottleneckCount} bottlenecks · ${snapshot.lowStockCount} low-stock items.`,
    category: "health",
    priority:
      snapshot.healthScore < 40 ? "CRITICAL" : snapshot.healthScore < 60 ? "HIGH" : "MEDIUM",
    recommendation: "Address bottlenecks and inventory gaps to improve operational health.",
    metadata: { healthScore: snapshot.healthScore },
  });
  created += 1;

  return created;
}
