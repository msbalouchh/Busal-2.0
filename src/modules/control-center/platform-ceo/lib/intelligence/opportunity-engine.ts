import "server-only";

import type { PlatformCeoExecutiveContext } from "@/modules/control-center/platform-ceo/types/platform-ceo.types";
import type {
  ExecutiveOpportunity,
  ExecutivePriority,
} from "@/modules/control-center/platform-ceo/types/platform-ceo-intelligence.types";

function priorityFromScore(score: number): ExecutivePriority {
  if (score >= 80) return "high";
  if (score >= 65) return "medium";
  return "low";
}

export function discoverExecutiveOpportunities(
  context: PlatformCeoExecutiveContext,
): ExecutiveOpportunity[] {
  const opportunities: ExecutiveOpportunity[] = [];

  const fastestGrowing = (
    context.businesses.fastestGrowing as
      | { items?: Array<{ id: string; name: string; metric: string; riskLevel: string | null }> }
      | undefined
  )?.items ?? [];

  for (const business of fastestGrowing.slice(0, 5)) {
    opportunities.push({
      id: `opp-growth-${business.id}`,
      title: `${business.name} — Expansion Candidate`,
      description: `Strong growth signals (${business.metric}). Consider plan upgrade or module expansion.`,
      businessId: business.id,
      businessName: business.name,
      priority: "high",
      confidence: 76,
    });
  }

  const topBusinesses = (
    context.businesses.top as
      | { items?: Array<{ id: string; name: string; metric: string; riskLevel: string | null }> }
      | undefined
  )?.items ?? [];

  for (const business of topBusinesses.slice(0, 3)) {
    if (fastestGrowing.some((entry) => entry.id === business.id)) continue;
    opportunities.push({
      id: `opp-upgrade-${business.id}`,
      title: `${business.name} — Upgrade Ready`,
      description: `High-performing account (${business.metric}) with low churn indicators. Review upsell readiness.`,
      businessId: business.id,
      businessName: business.name,
      priority: priorityFromScore(75),
      confidence: 71,
    });
  }

  const expansionScore = context.intelligenceSummary.scores.find((s) => s.id === "expansion");
  if (expansionScore && expansionScore.value > 0) {
    opportunities.push({
      id: "opp-platform-expansion",
      title: "Platform Expansion Window",
      description: `${expansionScore.value} businesses show expansion readiness across the platform.`,
      businessId: null,
      businessName: null,
      priority: expansionScore.value >= 10 ? "high" : "medium",
      confidence: 69,
    });
  }

  const aiScore = context.intelligenceSummary.scores.find((s) => s.id === "ai-adoption");
  if (aiScore && aiScore.value >= 60) {
    opportunities.push({
      id: "opp-ai-expansion",
      title: "AI Module Cross-Sell",
      description: "AI adoption is healthy — target laggard businesses with AI onboarding campaigns.",
      businessId: null,
      businessName: null,
      priority: "medium",
      confidence: 66,
    });
  }

  for (const rec of context.intelligenceSummary.recommendations.slice(0, 3)) {
    opportunities.push({
      id: `opp-rec-${rec.id}`,
      title: rec.title,
      description: rec.description,
      businessId: null,
      businessName: null,
      priority: rec.priority === "high" ? "high" : rec.priority === "medium" ? "medium" : "low",
      confidence: 73,
    });
  }

  return opportunities;
}
