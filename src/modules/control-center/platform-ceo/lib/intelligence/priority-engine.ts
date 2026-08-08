import "server-only";

import type { PlatformCeoExecutiveContext } from "@/modules/control-center/platform-ceo/types/platform-ceo.types";
import type {
  ExecutiveAlert,
  ExecutivePriority,
  ExecutivePriorityItem,
  ExecutiveRecommendation,
} from "@/modules/control-center/platform-ceo/types/platform-ceo-intelligence.types";
import { analyzeExecutiveRisks } from "@/modules/control-center/platform-ceo/lib/intelligence/risk-engine";
import { discoverExecutiveOpportunities } from "@/modules/control-center/platform-ceo/lib/intelligence/opportunity-engine";

function priorityWeight(priority: ExecutivePriority): number {
  return { critical: 4, high: 3, medium: 2, low: 1 }[priority];
}

export function buildExecutiveAlerts(context: PlatformCeoExecutiveContext): ExecutiveAlert[] {
  const alerts = (context.platformHealth.alerts as Array<{
    id: string;
    severity: "info" | "warning" | "critical";
    title: string;
    description: string;
    module: string | null;
  }> | undefined) ?? [];

  return alerts.map((alert) => ({
    id: alert.id,
    severity: alert.severity,
    title: alert.title,
    description: alert.description,
    domain: alert.module ?? "platform",
  }));
}

export function buildExecutiveRecommendations(
  context: PlatformCeoExecutiveContext,
): ExecutiveRecommendation[] {
  const recommendations: ExecutiveRecommendation[] = [];

  for (const rec of context.intelligenceSummary.recommendations) {
    recommendations.push({
      id: rec.id,
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      domain: "commercial",
      readOnly: true,
      actionLabel: rec.actionLabel,
    });
  }

  const risks = analyzeExecutiveRisks(context);
  for (const risk of risks.slice(0, 3)) {
    recommendations.push({
      id: `rec-risk-${risk.id}`,
      title: `Mitigate: ${risk.title}`,
      description: risk.description,
      priority: risk.severity,
      domain: risk.domain,
      readOnly: true,
      actionLabel: "Review in Control Center",
    });
  }

  return recommendations.sort(
    (left, right) => priorityWeight(right.priority) - priorityWeight(left.priority),
  );
}

export function buildExecutivePriorityQueue(
  context: PlatformCeoExecutiveContext,
): ExecutivePriorityItem[] {
  const items: ExecutivePriorityItem[] = [];
  const risks = analyzeExecutiveRisks(context);
  const opportunities = discoverExecutiveOpportunities(context);
  const alerts = buildExecutiveAlerts(context);

  for (const alert of alerts.filter((a) => a.severity === "critical")) {
    items.push({
      id: `pq-alert-${alert.id}`,
      rank: 0,
      title: alert.title,
      description: alert.description,
      priority: "critical",
      domain: alert.domain,
    });
  }

  for (const risk of risks.slice(0, 4)) {
    items.push({
      id: `pq-risk-${risk.id}`,
      rank: 0,
      title: risk.title,
      description: risk.description,
      priority: risk.severity,
      domain: risk.domain,
    });
  }

  for (const opp of opportunities.slice(0, 3)) {
    items.push({
      id: `pq-opp-${opp.id}`,
      rank: 0,
      title: opp.title,
      description: opp.description,
      priority: opp.priority,
      domain: "opportunities",
    });
  }

  const atRisk = (
    context.businesses.atRisk as
      | { items?: Array<{ id: string; name: string; metric: string }> }
      | undefined
  )?.items ?? [];

  for (const business of atRisk.slice(0, 3)) {
    items.push({
      id: `pq-business-${business.id}`,
      rank: 0,
      title: `Review ${business.name}`,
      description: `At-risk business flagged (${business.metric}). Schedule operator review.`,
      priority: "high",
      domain: "businesses",
    });
  }

  return items
    .sort((left, right) => priorityWeight(right.priority) - priorityWeight(left.priority))
    .map((item, index) => ({ ...item, rank: index + 1 }))
    .slice(0, 10);
}
