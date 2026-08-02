import "server-only";

import {
  createOperationInsight,
  createOperationRecommendation,
} from "@/services/ai-operations-efficiency-recommendation.service";
import { detectOperationalBottlenecks } from "@/services/ai-operations-bottleneck-detection.service";
import { getInventoryHealthSnapshot } from "@/services/ai-operations-inventory-health.service";
import { getWorkflowSnapshot } from "@/services/ai-operations-workflow-analysis.service";
import { getOwnedBusinessId } from "@/services/ai-operations-context.service";

export interface OperationalRiskAlert {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: string;
  recommendation: string;
}

export async function detectOperationalRisks(ownerId: string): Promise<OperationalRiskAlert[]> {
  const [bottlenecks, inventory, workflow] = await Promise.all([
    detectOperationalBottlenecks(ownerId),
    getInventoryHealthSnapshot(ownerId),
    getWorkflowSnapshot(ownerId),
  ]);

  const risks: OperationalRiskAlert[] = bottlenecks.map((b) => ({
    id: b.id,
    title: `${b.area} bottleneck`,
    description: b.description,
    severity: b.severity,
    category: "bottleneck",
    recommendation: b.recommendation,
  }));

  if (inventory.outOfStockCount > 0) {
    risks.push({
      id: "inventory-stockout",
      title: "Inventory stockout risk",
      description: `${inventory.outOfStockCount} items out of stock may halt operations.`,
      severity: "CRITICAL",
      category: "inventory",
      recommendation: "Emergency reorder and menu item substitution.",
    });
  }

  if (workflow.cancelledOrders > 3) {
    risks.push({
      id: "high-cancellations",
      title: "High order cancellation rate",
      description: `${workflow.cancelledOrders} cancellations may indicate service failures.`,
      severity: "HIGH",
      category: "order",
      recommendation: "Investigate root causes and improve order accuracy.",
    });
  }

  return risks.sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[a.severity] - order[b.severity];
  });
}

export async function generateOperationalRiskInsights(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const risks = await detectOperationalRisks(ownerId);
  let created = 0;

  const critical = risks.filter((r) => r.severity === "CRITICAL" || r.severity === "HIGH");
  if (critical.length > 0) {
    await createOperationInsight(businessId, {
      title: "Operational risk alerts",
      description: `${critical.length} high-priority operational risks detected.`,
      category: "risk",
      priority: "CRITICAL",
      recommendation: critical.map((r) => r.title).join(", "),
      metadata: { riskIds: critical.map((r) => r.id) },
    });
    created += 1;
  }

  for (const risk of critical.slice(0, 3)) {
    await createOperationRecommendation(businessId, {
      title: risk.title,
      description: risk.description,
      action: risk.recommendation,
      expectedImpact: "Reduced operational disruption",
      confidenceScore: risk.severity === "CRITICAL" ? 0.95 : 0.8,
      metadata: { riskId: risk.id },
    });
    created += 1;
  }

  return created;
}
