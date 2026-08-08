import "server-only";

import { randomUUID } from "crypto";

import type { PlatformCeoExecutiveContext } from "@/modules/control-center/platform-ceo/types/platform-ceo.types";
import type {
  ExecutiveAdvisoryResponse,
  ExecutiveReportKind,
  ExecutivePriority,
  PlatformCeoExecutiveReport,
} from "@/modules/control-center/platform-ceo/types/platform-ceo-intelligence.types";
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

const REPORT_TITLES: Record<ExecutiveReportKind, string> = {
  morning_brief: "Morning Executive Brief",
  evening_summary: "Evening Executive Summary",
  weekly_board: "Weekly Board Report",
  monthly_executive: "Monthly Executive Report",
  revenue_forecast: "Revenue Forecast Report",
  growth_forecast: "Growth Forecast Report",
  churn_forecast: "Churn Forecast Report",
  platform_health: "Platform Health Report",
  risk_analysis: "Risk Analysis Report",
  priority_queue: "Executive Priority Queue",
  opportunities: "Business Opportunities Report",
};

function periodLabel(kind: ExecutiveReportKind): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  switch (kind) {
    case "weekly_board":
      return `Week of ${date}`;
    case "monthly_executive":
      return now.toLocaleString("en-GB", { month: "long", year: "numeric" });
    case "morning_brief":
      return `Morning — ${date}`;
    case "evening_summary":
      return `Evening — ${date}`;
    default:
      return date;
  }
}

function buildReportAdvisory(
  context: PlatformCeoExecutiveContext,
  kind: ExecutiveReportKind,
): ExecutiveAdvisoryResponse {
  switch (kind) {
    case "morning_brief":
      return buildQuestionAdvisory(context, "What should I do today?", ["priority"]);
    case "evening_summary":
      return buildQuestionAdvisory(context, "What changed today?", ["monitoring", "support"]);
    case "weekly_board":
      return {
        executiveSummary: context.intelligenceSummary.weekly,
        supportingData: { weekly: context.intelligenceSummary.weekly, trends: context.growth },
        reasoning: "Weekly board synthesis from Platform Intelligence weekly executive summary and trend data.",
        confidence: 78,
        recommendedActions: buildExecutiveRecommendations(context).slice(0, 8),
        priority: (buildExecutivePriorityQueue(context)[0]?.priority ?? "medium") as ExecutivePriority,
      };
    case "monthly_executive":
      return {
        executiveSummary: context.intelligenceSummary.monthly,
        supportingData: { monthly: context.intelligenceSummary.monthly, commercial: context.commercial },
        reasoning: "Monthly executive synthesis from Platform Intelligence monthly summary and commercial signals.",
        confidence: 80,
        recommendedActions: buildExecutiveRecommendations(context).slice(0, 10),
        priority: (buildExecutivePriorityQueue(context)[0]?.priority ?? "medium") as ExecutivePriority,
      };
    case "revenue_forecast":
    case "growth_forecast":
    case "churn_forecast": {
      const forecasts = buildExecutiveForecasts(context);
      const forecast = forecasts.find((f) => f.id.includes(kind.split("_")[0] ?? "")) ?? forecasts[0];
      return {
        executiveSummary: forecast?.narrative ?? "Forecast unavailable for current intelligence window.",
        supportingData: { forecasts },
        reasoning: "Forecast derived from intelligence scores and trend projections — advisory only.",
        confidence: forecast?.confidence ?? 65,
        recommendedActions: buildExecutiveRecommendations(context).slice(0, 5),
        priority: "medium" as ExecutivePriority,
      };
    }
    case "platform_health":
      return buildPlatformHealthAdvisory(context);
    case "risk_analysis":
      return buildRiskAnalysisAdvisory(context);
    case "priority_queue": {
      const queue = buildExecutivePriorityQueue(context);
      return {
        executiveSummary: queue.length
          ? `Top priority: ${queue[0]?.title}. ${queue.length} items in executive queue.`
          : "No priority items flagged.",
        supportingData: { priorityQueue: queue },
        reasoning: "Priority queue ranked by risk severity, alerts, and opportunity signals.",
        confidence: 77,
        recommendedActions: buildExecutiveRecommendations(context).slice(0, 5),
        priority: (queue[0]?.priority ?? "low") as ExecutivePriority,
      };
    }
    case "opportunities": {
      const opps = discoverExecutiveOpportunities(context);
      return {
        executiveSummary: opps.length
          ? `${opps.length} business opportunities identified. Lead: ${opps[0]?.title}.`
          : "No expansion opportunities flagged in current window.",
        supportingData: { opportunities: opps },
        reasoning: "Opportunities derived from growth rankings, expansion scores, and intelligence recommendations.",
        confidence: 74,
        recommendedActions: buildExecutiveRecommendations(context).slice(0, 5),
        priority: "medium" as ExecutivePriority,
      };
    }
    default:
      return buildPlatformHealthAdvisory(context);
  }
}

export function generateExecutiveReport(
  context: PlatformCeoExecutiveContext,
  kind: ExecutiveReportKind,
): PlatformCeoExecutiveReport {
  const advisory = buildReportAdvisory(context, kind);

  return {
    id: randomUUID(),
    kind,
    title: REPORT_TITLES[kind],
    generatedAt: new Date().toISOString(),
    periodLabel: periodLabel(kind),
    advisory,
    insights: buildExecutiveInsights(context),
    forecasts: buildExecutiveForecasts(context),
    risks: analyzeExecutiveRisks(context),
    opportunities: discoverExecutiveOpportunities(context),
    alerts: buildExecutiveAlerts(context),
    priorityQueue: buildExecutivePriorityQueue(context),
    recommendations: buildExecutiveRecommendations(context),
  };
}

export function generateAllScheduledReports(
  context: PlatformCeoExecutiveContext,
): PlatformCeoExecutiveReport[] {
  const kinds: ExecutiveReportKind[] = [
    "morning_brief",
    "evening_summary",
    "weekly_board",
    "monthly_executive",
    "revenue_forecast",
    "growth_forecast",
    "churn_forecast",
    "platform_health",
    "risk_analysis",
    "priority_queue",
    "opportunities",
  ];

  return kinds.map((kind) => generateExecutiveReport(context, kind));
}
