import "server-only";

import type { PlatformCeoExecutiveContext } from "@/modules/control-center/platform-ceo/types/platform-ceo.types";
import type {
  ExecutivePriority,
  ExecutiveRisk,
} from "@/modules/control-center/platform-ceo/types/platform-ceo-intelligence.types";

function severityFromScore(scoreValue: number, invert = false): ExecutivePriority {
  const effective = invert ? 100 - scoreValue : scoreValue;
  if (effective >= 75) return "critical";
  if (effective >= 55) return "high";
  if (effective >= 35) return "medium";
  return "low";
}

export function analyzeExecutiveRisks(context: PlatformCeoExecutiveContext): ExecutiveRisk[] {
  const risks: ExecutiveRisk[] = [];

  const alerts = (context.platformHealth.alerts as Array<{
    id: string;
    severity: string;
    title: string;
    description: string;
    module: string | null;
  }> | undefined) ?? [];

  for (const alert of alerts) {
    risks.push({
      id: `risk-alert-${alert.id}`,
      title: alert.title,
      description: alert.description,
      severity:
        alert.severity === "critical"
          ? "critical"
          : alert.severity === "warning"
            ? "high"
            : "medium",
      domain: alert.module ?? "monitoring",
      confidence: alert.severity === "critical" ? 88 : 74,
    });
  }

  const scoreRisks: Array<{ id: string; scoreId: string; title: string; domain: string; invert?: boolean }> = [
    { id: "risk-churn", scoreId: "churn-risk", title: "Elevated Churn Risk", domain: "churn", invert: false },
    { id: "risk-security", scoreId: "security-risk", title: "Security Exposure", domain: "security", invert: false },
    { id: "risk-support", scoreId: "support-health", title: "Support Strain", domain: "support", invert: true },
    { id: "risk-capacity", scoreId: "system-capacity", title: "System Capacity Pressure", domain: "monitoring", invert: true },
    { id: "risk-bottleneck", scoreId: "bottleneck", title: "Operational Bottleneck", domain: "monitoring", invert: false },
  ];

  for (const entry of scoreRisks) {
    const score = context.intelligenceSummary.scores.find((s) => s.id === entry.scoreId);
    if (!score) continue;

    const severity = severityFromScore(score.value, entry.invert);
    if (severity === "low") continue;

    risks.push({
      id: entry.id,
      title: entry.title,
      description: `${entry.title} score is ${score.value}/100.`,
      severity,
      domain: entry.domain,
      confidence: 70 + Math.min(20, score.value / 5),
    });
  }

  const atRisk = (
    context.businesses.atRisk as { items?: Array<{ name: string; riskLevel: string | null }> } | undefined
  )?.items ?? [];

  if (atRisk.length > 0) {
    risks.push({
      id: "risk-business-concentration",
      title: "At-Risk Business Concentration",
      description: `${atRisk.length} businesses flagged at risk, including ${atRisk.slice(0, 3).map((b) => b.name).join(", ")}.`,
      severity: atRisk.length >= 5 ? "critical" : "high",
      domain: "businesses",
      confidence: 78,
    });
  }

  return risks.sort((left, right) => {
    const order: Record<ExecutivePriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[left.severity] - order[right.severity];
  });
}
