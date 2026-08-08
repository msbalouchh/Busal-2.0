import type { PlatformCeoExecutiveContext } from "@/modules/control-center/platform-ceo/types/platform-ceo.types";

export type ExecutivePriority = "critical" | "high" | "medium" | "low";

export type ExecutiveReportKind =
  | "morning_brief"
  | "evening_summary"
  | "weekly_board"
  | "monthly_executive"
  | "revenue_forecast"
  | "growth_forecast"
  | "churn_forecast"
  | "platform_health"
  | "risk_analysis"
  | "priority_queue"
  | "opportunities";

export interface ExecutiveRecommendation {
  id: string;
  title: string;
  description: string;
  priority: ExecutivePriority;
  domain: string;
  readOnly: true;
  actionLabel: string | null;
}

export interface ExecutiveAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  domain: string;
}

export interface ExecutiveForecast {
  id: string;
  label: string;
  currentValue: number | null;
  projectedValue: number | null;
  horizonDays: number;
  trend: "up" | "down" | "flat";
  confidence: number;
  narrative: string;
}

export interface ExecutiveRisk {
  id: string;
  title: string;
  description: string;
  severity: ExecutivePriority;
  domain: string;
  confidence: number;
}

export interface ExecutiveOpportunity {
  id: string;
  title: string;
  description: string;
  businessId: string | null;
  businessName: string | null;
  priority: ExecutivePriority;
  confidence: number;
}

export interface ExecutivePriorityItem {
  id: string;
  rank: number;
  title: string;
  description: string;
  priority: ExecutivePriority;
  domain: string;
}

export interface ExecutiveAdvisoryResponse {
  executiveSummary: string;
  supportingData: Record<string, unknown>;
  reasoning: string;
  confidence: number;
  recommendedActions: ExecutiveRecommendation[];
  priority: ExecutivePriority;
}

export interface ExecutiveInsight {
  id: string;
  domain: string;
  title: string;
  summary: string;
  metric: string | null;
  trend: "up" | "down" | "flat" | null;
  confidence: number;
}

export interface PlatformCeoExecutiveReport {
  id: string;
  kind: ExecutiveReportKind;
  title: string;
  generatedAt: string;
  periodLabel: string;
  advisory: ExecutiveAdvisoryResponse;
  insights: ExecutiveInsight[];
  forecasts: ExecutiveForecast[];
  risks: ExecutiveRisk[];
  opportunities: ExecutiveOpportunity[];
  alerts: ExecutiveAlert[];
  priorityQueue: ExecutivePriorityItem[];
  recommendations: ExecutiveRecommendation[];
}

export interface PlatformCeoIntelligenceAnalysis {
  generatedAt: string;
  insights: ExecutiveInsight[];
  forecasts: ExecutiveForecast[];
  risks: ExecutiveRisk[];
  opportunities: ExecutiveOpportunity[];
  alerts: ExecutiveAlert[];
  priorityQueue: ExecutivePriorityItem[];
  recommendations: ExecutiveRecommendation[];
  platformHealthReport: ExecutiveAdvisoryResponse;
  riskAnalysis: ExecutiveAdvisoryResponse;
}

export interface PlatformCeoReportsBundle {
  permissions: { canView: boolean; canGenerate: boolean };
  reports: PlatformCeoExecutiveReport[];
  latestMorningBrief: PlatformCeoExecutiveReport | null;
  latestWeeklyReport: PlatformCeoExecutiveReport | null;
  latestMonthlyReport: PlatformCeoExecutiveReport | null;
  refreshedAt: string;
}

export interface ExecutiveReasoningInput {
  context: PlatformCeoExecutiveContext;
  question?: string;
  reportKind?: ExecutiveReportKind;
}

export const EXECUTIVE_QUESTION_PATTERNS: Array<{
  id: string;
  patterns: RegExp[];
  focusDomains: string[];
}> = [
  {
    id: "platform-performance",
    patterns: [/how is busal performing/i, /platform performance/i, /overall performance/i],
    focusDomains: ["platformHealth", "growth", "revenue"],
  },
  {
    id: "what-changed-today",
    patterns: [/what changed today/i, /today'?s changes/i, /what happened today/i],
    focusDomains: ["monitoring", "support", "growth"],
  },
  {
    id: "businesses-attention",
    patterns: [/which businesses require/i, /need my attention/i, /at.?risk/i],
    focusDomains: ["businesses", "churn"],
  },
  {
    id: "mrr-decrease",
    patterns: [/why did mrr/i, /mrr decrease/i, /mrr drop/i, /revenue decline/i],
    focusDomains: ["revenue", "subscriptions", "churn"],
  },
  {
    id: "upgrade-ready",
    patterns: [/ready for upgrade/i, /expansion opportunit/i, /upsell/i],
    focusDomains: ["opportunities", "growth"],
  },
  {
    id: "operational-risk",
    patterns: [/biggest operational risk/i, /operational risk/i, /platform risk/i],
    focusDomains: ["monitoring", "security", "support"],
  },
  {
    id: "module-attention",
    patterns: [/which module/i, /module needs attention/i, /feature adoption/i],
    focusDomains: ["featureFlags", "aiUsage"],
  },
  {
    id: "bottlenecks",
    patterns: [/bottleneck/i, /operational load/i, /capacity/i],
    focusDomains: ["monitoring", "platformHealth"],
  },
  {
    id: "losing-money",
    patterns: [/losing money/i, /revenue leak/i, /cost/i, /where are we losing/i],
    focusDomains: ["revenue", "billing", "churn"],
  },
  {
    id: "what-to-do-today",
    patterns: [/what should i do today/i, /priorities today/i, /focus today/i],
    focusDomains: ["priority"],
  },
];
