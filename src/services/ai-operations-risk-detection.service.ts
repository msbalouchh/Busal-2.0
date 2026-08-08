import "server-only";

import {
  createOperationInsight,
  createOperationRecommendation,
} from "@/services/ai-operations-efficiency-recommendation.service";
import {
  runOwnerDomainDetectionTask,
  runOwnerDomainInsightTask,
} from "@/services/ai-domain-insight-runner.service";
import { detectOperationalBottlenecks } from "@/services/ai-operations-bottleneck-detection.service";
import { getInventoryHealthSnapshot } from "@/services/ai-operations-inventory-health.service";
import { getWorkflowSnapshot } from "@/services/ai-operations-workflow-analysis.service";

export interface OperationalRiskAlert {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: string;
  recommendation: string;
}

export async function detectOperationalRisks(ownerId: string): Promise<OperationalRiskAlert[]> {
  return runOwnerDomainDetectionTask<OperationalRiskAlert>(ownerId, {
    module: "operations",
    task: "operational-risk-detection",
    responseKey: "alerts",
    loadContext: async (id) => {
      const [bottlenecks, inventory, workflow] = await Promise.all([
        detectOperationalBottlenecks(id),
        getInventoryHealthSnapshot(id),
        getWorkflowSnapshot(id),
      ]);
      return { bottlenecks, inventory, workflow };
    },
  });
}

export async function generateOperationalRiskInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "operations",
    task: "operational-risk-insights",
    loadContext: async (ownerId) => ({ ownerId }),
    persistInsight: (businessId, insight) =>
      createOperationInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "risk",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
    persistRecommendation: (businessId, recommendation) =>
      createOperationRecommendation(businessId, {
        title: recommendation.title,
        description: recommendation.description,
        action: recommendation.action ?? recommendation.recommendation ?? "Review AI recommendation",
        expectedImpact: recommendation.expectedImpact,
        confidenceScore: recommendation.confidenceScore,
        metadata: recommendation.metadata,
      }),
  });
}
