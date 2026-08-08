import "server-only";

import type { PlatformCeoExecutiveContext } from "@/modules/control-center/platform-ceo/types/platform-ceo.types";
import type {
  ExecutiveAdvisoryResponse,
  ExecutiveRecommendation,
} from "@/modules/control-center/platform-ceo/types/platform-ceo-intelligence.types";
import {
  buildSupportingDataSnapshot,
  deriveOverallPriority,
} from "@/modules/control-center/platform-ceo/lib/intelligence/executive-insight-builder";
import { buildExecutiveRecommendations } from "@/modules/control-center/platform-ceo/lib/intelligence/priority-engine";
import { analyzeExecutiveRisks } from "@/modules/control-center/platform-ceo/lib/intelligence/risk-engine";
import { discoverExecutiveOpportunities } from "@/modules/control-center/platform-ceo/lib/intelligence/opportunity-engine";
import { buildExecutivePriorityQueue } from "@/modules/control-center/platform-ceo/lib/intelligence/priority-engine";

export function generateExecutiveRecommendations(
  context: PlatformCeoExecutiveContext,
): ExecutiveRecommendation[] {
  return buildExecutiveRecommendations(context);
}

export function buildPlatformHealthAdvisory(
  context: PlatformCeoExecutiveContext,
): ExecutiveAdvisoryResponse {
  const healthScore = context.intelligenceSummary.scores.find((s) => s.id === "platform-health");
  const capacityScore = context.intelligenceSummary.scores.find((s) => s.id === "system-capacity");
  const recommendations = generateExecutiveRecommendations(context).slice(0, 5);

  const summary = healthScore
    ? `Platform health is ${healthScore.value}/100. ${context.intelligenceSummary.weekly}`
    : context.intelligenceSummary.weekly;

  return {
    executiveSummary: summary,
    supportingData: buildSupportingDataSnapshot(context, [
      "platformHealth",
      "monitoring",
      "growth",
      "revenue",
    ]),
    reasoning: [
      healthScore ? `Platform health score: ${healthScore.value}/100.` : null,
      capacityScore ? `System capacity score: ${capacityScore.value}/100.` : null,
      `${context.intelligenceSummary.operationalInsights.length} operational insights evaluated.`,
      `${analyzeExecutiveRisks(context).length} active risk signals detected.`,
    ]
      .filter(Boolean)
      .join(" "),
    confidence: healthScore ? Math.min(92, 55 + healthScore.value / 3) : 68,
    recommendedActions: recommendations,
    priority: deriveOverallPriority(context),
  };
}

export function buildRiskAnalysisAdvisory(
  context: PlatformCeoExecutiveContext,
): ExecutiveAdvisoryResponse {
  const risks = analyzeExecutiveRisks(context);
  const topRisk = risks[0];

  return {
    executiveSummary: topRisk
      ? `Primary platform risk: ${topRisk.title}. ${topRisk.description}`
      : "No elevated platform risks detected in current intelligence window.",
    supportingData: buildSupportingDataSnapshot(context, ["security", "monitoring", "churn", "support"]),
    reasoning: risks
      .slice(0, 5)
      .map((risk) => `${risk.title} (${risk.severity}, confidence ${risk.confidence}%).`)
      .join(" "),
    confidence: topRisk?.confidence ?? 60,
    recommendedActions: generateExecutiveRecommendations(context)
      .filter((rec) => rec.domain === "security" || rec.domain === "monitoring" || rec.domain === "churn")
      .slice(0, 5),
    priority: topRisk?.severity ?? deriveOverallPriority(context),
  };
}

export function buildQuestionAdvisory(
  context: PlatformCeoExecutiveContext,
  question: string,
  focusDomains: string[],
): ExecutiveAdvisoryResponse {
  const recommendations = generateExecutiveRecommendations(context).slice(0, 5);
  const risks = analyzeExecutiveRisks(context);
  const opportunities = discoverExecutiveOpportunities(context);
  const priorityQueue = buildExecutivePriorityQueue(context);

  let executiveSummary = context.intelligenceSummary.weekly;
  let reasoning = "Analysis derived from Platform Intelligence executive context without autonomous action.";
  let priority = deriveOverallPriority(context);
  let confidence = 72;

  const normalized = question.toLowerCase();

  if (/how is busal performing/i.test(normalized)) {
    const health = context.intelligenceSummary.scores.find((s) => s.id === "platform-health");
    executiveSummary = `Busal platform performance: health ${health?.value ?? "N/A"}/100. ${context.intelligenceSummary.monthly}`;
    confidence = 80;
  } else if (/what changed today/i.test(normalized)) {
    executiveSummary = `${context.intelligenceSummary.operationalInsights[0] ?? "No major operational shifts detected today."} ${priorityQueue[0]?.title ? `Top priority: ${priorityQueue[0].title}.` : ""}`;
    confidence = 74;
  } else if (/which businesses require|need my attention/i.test(normalized)) {
    const atRisk = (
      context.businesses.atRisk as { items?: Array<{ name: string }> } | undefined
    )?.items ?? [];
    executiveSummary =
      atRisk.length > 0
        ? `Businesses requiring attention: ${atRisk.map((b) => b.name).join(", ")}.`
        : "No businesses currently flagged as high-attention in intelligence rankings.";
    confidence = 78;
  } else if (/why did mrr|mrr decrease|revenue decline/i.test(normalized)) {
    const churn = context.intelligenceSummary.scores.find((s) => s.id === "churn-risk");
    const revenue = context.intelligenceSummary.scores.find((s) => s.id === "period-revenue");
    executiveSummary = `MRR/revenue movement likely driven by churn risk (${churn?.value ?? "N/A"}/100) and period revenue performance. Review at-risk accounts and billing anomalies.`;
    reasoning = risks
      .filter((r) => r.domain === "churn" || r.domain === "billing" || r.domain === "revenue")
      .map((r) => r.description)
      .join(" ");
    confidence = 70;
  } else if (/ready for upgrade|expansion opportunit/i.test(normalized)) {
    executiveSummary =
      opportunities.length > 0
        ? `Upgrade-ready accounts: ${opportunities
            .filter((o) => o.businessName)
            .slice(0, 5)
            .map((o) => o.businessName)
            .join(", ")}.`
        : "No strong upgrade signals in current expansion window.";
    confidence = 75;
  } else if (/biggest operational risk|operational risk/i.test(normalized)) {
    return buildRiskAnalysisAdvisory(context);
  } else if (/which module|module needs attention|feature adoption/i.test(normalized)) {
    const feature = context.intelligenceSummary.scores.find((s) => s.id === "feature-adoption");
    const ai = context.intelligenceSummary.scores.find((s) => s.id === "ai-adoption");
    executiveSummary = `Module attention: Feature adoption ${feature?.value ?? "N/A"}/100, AI adoption ${ai?.value ?? "N/A"}/100. Prioritize lowest adoption module for operator review.`;
    confidence = 73;
  } else if (/bottleneck|operational load|capacity/i.test(normalized)) {
    const bottleneck = context.intelligenceSummary.scores.find((s) => s.id === "bottleneck");
    const capacity = context.intelligenceSummary.scores.find((s) => s.id === "system-capacity");
    executiveSummary = `Operational load ${bottleneck?.value ?? "N/A"}/100, system capacity ${capacity?.value ?? "N/A"}/100. ${context.intelligenceSummary.operationalInsights.find((i) => i.toLowerCase().includes("api") || i.toLowerCase().includes("load")) ?? ""}`;
    confidence = 76;
  } else if (/losing money|revenue leak|where are we losing/i.test(normalized)) {
    executiveSummary = `Revenue leakage signals: churn risk ${context.intelligenceSummary.scores.find((s) => s.id === "churn-risk")?.value ?? "N/A"}/100, support load ${context.intelligenceSummary.scores.find((s) => s.id === "support-health")?.value ?? "N/A"}/100. Review dormant and at-risk accounts.`;
    confidence = 71;
  } else if (/what should i do today|priorities today|focus today/i.test(normalized)) {
    executiveSummary =
      priorityQueue.length > 0
        ? `Today's priorities: ${priorityQueue
            .slice(0, 3)
            .map((item) => item.title)
            .join("; ")}.`
        : "No critical priorities flagged — maintain monitoring cadence.";
    priority = priorityQueue[0]?.priority ?? priority;
    confidence = 79;
  }

  return {
    executiveSummary,
    supportingData: buildSupportingDataSnapshot(context, focusDomains),
    reasoning,
    confidence,
    recommendedActions: recommendations,
    priority,
  };
}
