import "server-only";

import type {
  ExecutiveAdvisoryResponse,
  ExecutivePriority,
  ExecutiveReasoningInput,
  PlatformCeoIntelligenceAnalysis,
} from "@/modules/control-center/platform-ceo/types/platform-ceo-intelligence.types";
import { EXECUTIVE_QUESTION_PATTERNS } from "@/modules/control-center/platform-ceo/types/platform-ceo-intelligence.types";
import { buildExecutiveInsights } from "@/modules/control-center/platform-ceo/lib/intelligence/executive-insight-builder";
import { buildExecutiveForecasts } from "@/modules/control-center/platform-ceo/lib/intelligence/forecast-engine";
import { analyzeExecutiveRisks } from "@/modules/control-center/platform-ceo/lib/intelligence/risk-engine";
import { discoverExecutiveOpportunities } from "@/modules/control-center/platform-ceo/lib/intelligence/opportunity-engine";
import {
  buildExecutiveAlerts,
  buildExecutivePriorityQueue,
  buildExecutiveRecommendations,
} from "@/modules/control-center/platform-ceo/lib/intelligence/priority-engine";
import {
  buildPlatformHealthAdvisory,
  buildQuestionAdvisory,
  buildRiskAnalysisAdvisory,
} from "@/modules/control-center/platform-ceo/lib/intelligence/executive-recommendation-engine";

export function runExecutiveReasoning(input: ExecutiveReasoningInput): ExecutiveAdvisoryResponse {
  const { context, question } = input;

  if (question?.trim()) {
    const match = EXECUTIVE_QUESTION_PATTERNS.find((entry) =>
      entry.patterns.some((pattern) => pattern.test(question)),
    );
    return buildQuestionAdvisory(context, question, match?.focusDomains ?? []);
  }

  if (input.reportKind === "risk_analysis") {
    return buildRiskAnalysisAdvisory(context);
  }

  return buildPlatformHealthAdvisory(context);
}

export function runFullExecutiveAnalysis(
  input: ExecutiveReasoningInput,
): PlatformCeoIntelligenceAnalysis {
  const { context, question } = input;

  return {
    generatedAt: new Date().toISOString(),
    insights: buildExecutiveInsights(context),
    forecasts: buildExecutiveForecasts(context),
    risks: analyzeExecutiveRisks(context),
    opportunities: discoverExecutiveOpportunities(context),
    alerts: buildExecutiveAlerts(context),
    priorityQueue: buildExecutivePriorityQueue(context),
    recommendations: buildExecutiveRecommendations(context),
    platformHealthReport: buildPlatformHealthAdvisory(context),
    riskAnalysis: buildRiskAnalysisAdvisory(context),
  };
}

export function formatAdvisoryForChat(advisory: ExecutiveAdvisoryResponse): string {
  const actions =
    advisory.recommendedActions.length > 0
      ? advisory.recommendedActions
          .slice(0, 5)
          .map(
            (action, index) =>
              `${index + 1}. [${action.priority.toUpperCase()}] ${action.title} — ${action.description}${action.actionLabel ? ` (${action.actionLabel})` : ""}`,
          )
          .join("\n")
      : "No recommended actions at this time.";

  return [
    "## Executive Summary",
    advisory.executiveSummary,
    "",
    "## Reasoning",
    advisory.reasoning,
    "",
    `**Confidence:** ${advisory.confidence}% | **Priority:** ${advisory.priority.toUpperCase()}`,
    "",
    "## Recommended Actions (Advisory Only — No Autonomous Execution)",
    actions,
  ].join("\n");
}
