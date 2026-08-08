import "server-only";

import type { PlatformCeoExecutiveContext } from "@/modules/control-center/platform-ceo/types/platform-ceo.types";
import type { PlatformCeoIntelligenceSummary } from "@/modules/control-center/platform-ceo/types/platform-ceo.types";
import type {
  ExecutiveInsight,
  ExecutivePriority,
} from "@/modules/control-center/platform-ceo/types/platform-ceo-intelligence.types";

function findScore(summary: PlatformCeoIntelligenceSummary, id: string) {
  return summary.scores.find((score) => score.id === id) ?? null;
}

function scoreTrend(score: { value: number } | null): "up" | "down" | "flat" | null {
  if (!score) return null;
  if (score.value >= 70) return "up";
  if (score.value <= 40) return "down";
  return "flat";
}

function clampConfidence(value: number): number {
  return Math.max(35, Math.min(95, Math.round(value)));
}

export function buildExecutiveInsights(context: PlatformCeoExecutiveContext): ExecutiveInsight[] {
  const { intelligenceSummary } = context;
  const insights: ExecutiveInsight[] = [];

  const domains: Array<{
    domain: string;
    scoreId: string;
    title: string;
  }> = [
    { domain: "platformHealth", scoreId: "platform-health", title: "Platform Health" },
    { domain: "revenue", scoreId: "period-revenue", title: "Revenue" },
    { domain: "growth", scoreId: "growth", title: "Growth" },
    { domain: "churn", scoreId: "churn-risk", title: "Churn Risk" },
    { domain: "businessHealth", scoreId: "business-health", title: "Business Health" },
    { domain: "aiUsage", scoreId: "ai-adoption", title: "AI Adoption" },
    { domain: "featureFlags", scoreId: "feature-adoption", title: "Feature Adoption" },
    { domain: "support", scoreId: "support-health", title: "Support Health" },
    { domain: "security", scoreId: "security-risk", title: "Security Risk" },
    { domain: "monitoring", scoreId: "bottleneck", title: "Operational Load" },
    { domain: "commercial", scoreId: "revenue-forecast", title: "Commercial Forecast" },
    { domain: "billing", scoreId: "period-revenue", title: "Billing Performance" },
  ];

  for (const entry of domains) {
    const score = findScore(intelligenceSummary, entry.scoreId);
    if (!score) continue;

    insights.push({
      id: `insight-${entry.domain}`,
      domain: entry.domain,
      title: entry.title,
      summary: `${entry.title} is at ${score.value}${score.format === "percent" ? "%" : score.format === "score" || !score.format ? "/100" : ""}.`,
      metric: `${score.value}`,
      trend: scoreTrend(score),
      confidence: clampConfidence(score.value > 0 ? 60 + score.value / 5 : 55),
    });
  }

  for (const insight of intelligenceSummary.operationalInsights.slice(0, 5)) {
    insights.push({
      id: `insight-op-${insights.length}`,
      domain: "monitoring",
      title: "Operational Signal",
      summary: insight,
      metric: null,
      trend: null,
      confidence: 72,
    });
  }

  return insights;
}

export function deriveOverallPriority(context: PlatformCeoExecutiveContext): ExecutivePriority {
  const churnScore = findScore(context.intelligenceSummary, "churn-risk");
  const securityScore = findScore(context.intelligenceSummary, "security-risk");
  const healthScore = findScore(context.intelligenceSummary, "platform-health");
  const criticalAlerts = (
    (context.platformHealth.alerts as Array<{ severity: string }> | undefined) ?? []
  ).filter((alert) => alert.severity === "critical").length;

  if (criticalAlerts > 0 || (churnScore?.value ?? 0) >= 75 || (securityScore?.value ?? 0) >= 75) {
    return "critical";
  }
  if ((healthScore?.value ?? 100) < 60 || (churnScore?.value ?? 0) >= 55) {
    return "high";
  }
  if ((healthScore?.value ?? 100) < 75) {
    return "medium";
  }
  return "low";
}

export function buildSupportingDataSnapshot(
  context: PlatformCeoExecutiveContext,
  focusDomains: string[] = [],
): Record<string, unknown> {
  const all: Record<string, unknown> = {
    platform: context.platform,
    platformHealth: context.platformHealth,
    revenue: context.revenue,
    growth: context.growth,
    churn: context.churn,
    businesses: context.businesses,
    security: context.security,
    monitoring: context.monitoring,
    aiUsage: context.aiUsage,
    featureFlags: context.featureFlags,
    support: context.support,
    commercial: context.commercial,
    subscriptions: context.subscriptions,
    intelligenceSummary: context.intelligenceSummary,
  };

  if (focusDomains.length === 0) return all;

  return Object.fromEntries(
    focusDomains.filter((domain) => domain in all).map((domain) => [domain, all[domain]]),
  );
}
