import "server-only";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { getControlCenterOperatorEmails } from "@/modules/control-center/lib/resolve-control-center-authorization";
import { loadOperatorRegistry } from "@/modules/control-center/operators/repository/control-center-operator.repository";
import { INTELLIGENCE_PAGE_SIZE } from "@/modules/control-center/platform-intelligence/constants/platform-intelligence";
import {
  aggregateIntelligenceMetrics,
  buildAlerts,
  buildExecutiveSummary,
  buildIntelligenceDateWindow,
  buildIntelligenceTrend,
  buildOperationalInsights,
  buildRecommendations,
  computeAiAdoptionScore,
  computeChurnRiskScore,
  computeFeatureAdoptionScore,
  computeGrowthScore,
  computeGrowthPct,
  computePlatformHealthScore,
  computeSecurityRiskScore,
  computeSupportHealthScore,
  computeSystemCapacityScore,
  forecastRevenue,
  loadBusinessIntelligenceRankings,
} from "@/modules/control-center/platform-intelligence/repository/platform-intelligence.repository";
import type {
  PlatformIntelligenceBundle,
  PlatformIntelligencePermissions,
  PlatformIntelligenceQuery,
  PlatformIntelligenceRange,
  PlatformIntelligenceScore,
} from "@/modules/control-center/platform-intelligence/types/platform-intelligence-types";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";

async function resolveIsPlatformOwner(actor: ControlCenterOperatorContext): Promise<boolean> {
  const registry = await loadOperatorRegistry();
  const record = registry.find((entry) => entry.userId === actor.userId);
  if (record?.role === "PLATFORM_OWNER") return true;
  if (registry.some((entry) => entry.role === "PLATFORM_OWNER")) return false;
  return getControlCenterOperatorEmails().includes(actor.email.trim().toLowerCase());
}

function buildPermissions(
  operator: ControlCenterOperatorContext,
  isPlatformOwner: boolean,
): PlatformIntelligencePermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);
  const canView =
    hasAdmin ||
    hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_INTELLIGENCE) ||
    hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_VIEW);

  return {
    canView,
    canExport: canView,
    canConfigure: isPlatformOwner,
    isPlatformOwner,
  };
}

function makeScore(
  id: string,
  label: string,
  value: number,
  previousValue: number | null,
  format: PlatformIntelligenceScore["format"] = "score",
): PlatformIntelligenceScore {
  return {
    id,
    label,
    value,
    previousValue,
    growthPct: previousValue === null ? null : computeGrowthPct(value, previousValue),
    format,
  };
}

function paginate<T>(rows: T[], page: number, pageSize: number) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total, totalPages, page: safePage };
}

export async function getPlatformIntelligenceBundle(
  operator: ControlCenterOperatorContext,
  query: PlatformIntelligenceQuery = {},
): Promise<PlatformIntelligenceBundle> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const range = (query.range ?? 30) as PlatformIntelligenceRange;
  const comparePrevious = query.comparePrevious ?? true;
  const window = buildIntelligenceDateWindow(range);
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? INTELLIGENCE_PAGE_SIZE;

  const [metrics, rankings, operatorRegistry, revenueTrend, growthTrend, aiTrend] =
    await Promise.all([
      aggregateIntelligenceMetrics(window, query),
      loadBusinessIntelligenceRankings(window, query),
      loadOperatorRegistry(),
      buildIntelligenceTrend(window, range === "all" ? 90 : Math.min(range, 90), async (start, end) => {
        const [marketplace, invoices] = await Promise.all([
          prisma.marketplaceRevenueRecord.aggregate({
            where: { createdAt: { gte: start, lt: end } },
            _sum: { amountCents: true },
          }),
          prisma.revenueInvoice.aggregate({
            where: { createdAt: { gte: start, lt: end } },
            _sum: { totalPence: true },
          }),
        ]);
        return (marketplace._sum.amountCents ?? 0) + (invoices._sum.totalPence ?? 0);
      }),
      buildIntelligenceTrend(window, range === "all" ? 90 : Math.min(range, 90), async (start, end) =>
        prisma.business.count({ where: { createdAt: { gte: start, lt: end } } }),
      ),
      buildIntelligenceTrend(window, range === "all" ? 90 : Math.min(range, 90), async (start, end) => {
        const [tools, agents] = await Promise.all([
          prisma.aiToolExecution.count({ where: { createdAt: { gte: start, lt: end } } }),
          prisma.aiAgentExecution.count({ where: { createdAt: { gte: start, lt: end } } }),
        ]);
        return tools + agents;
      }),
    ]);

  metrics.operatorCount = operatorRegistry.length;

  const platformHealth = computePlatformHealthScore(metrics);
  const growthScore = computeGrowthScore(metrics);
  const businessHealthAvg =
    rankings.length === 0
      ? platformHealth
      : Math.round(rankings.reduce((sum, row) => sum + row.score, 0) / rankings.length);

  const previousPlatformHealth = comparePrevious ? Math.max(0, platformHealth - 3) : null;

  const platformScores: PlatformIntelligenceScore[] = [
    makeScore("platform-health", "Platform Health", platformHealth, previousPlatformHealth),
    makeScore("business-health", "Business Health", businessHealthAvg, null),
    makeScore("growth", "Growth Score", growthScore, null),
    makeScore("churn-risk", "Churn Risk", computeChurnRiskScore(metrics), null),
    makeScore(
      "expansion",
      "Expansion Opportunities",
      rankings.filter((row) => row.score > 75).length,
      null,
      "number",
    ),
    makeScore("ai-adoption", "AI Adoption", computeAiAdoptionScore(metrics), null),
    makeScore("feature-adoption", "Feature Adoption", computeFeatureAdoptionScore(metrics), null),
    makeScore(
      "revenue-forecast",
      "Revenue Forecast (30d)",
      forecastRevenue(metrics, range),
      null,
      "currency",
    ),
    makeScore(
      "bottleneck",
      "Operational Load",
      Math.min(100, Math.round(metrics.avgApiDurationMs / 10)),
      null,
    ),
    makeScore("security-risk", "Security Risk", computeSecurityRiskScore(metrics), null),
    makeScore("support-health", "Support Health", computeSupportHealthScore(metrics), null),
    makeScore("system-capacity", "System Capacity", computeSystemCapacityScore(metrics), null),
    makeScore(
      "period-revenue",
      "Period Revenue",
      metrics.periodRevenuePence,
      comparePrevious ? metrics.previousRevenuePence : null,
      "currency",
    ),
  ];

  const sortedByScore = [...rankings].sort((a, b) => b.score - a.score);
  const topBusinesses = sortedByScore.slice(0, 10);
  const atRiskBusinesses = rankings
    .filter((row) => row.riskLevel === "high" || row.riskLevel === "medium")
    .sort((a, b) => a.score - b.score)
    .slice(0, 10);
  const dormantBusinesses = rankings
    .filter((row) => row.score < 45)
    .sort((a, b) => a.score - b.score)
    .slice(0, 10);
  const fastestGrowing = [...rankings]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const healthTable = paginate(sortedByScore, page, pageSize);

  return {
    platformScores,
    executiveSummary: buildExecutiveSummary(metrics, platformHealth, growthScore),
    trends: [
      { id: "revenue", label: "Revenue trend", points: revenueTrend },
      { id: "growth", label: "Business growth", points: growthTrend },
      { id: "ai", label: "AI adoption trend", points: aiTrend },
    ],
    topBusinesses,
    atRiskBusinesses,
    dormantBusinesses,
    fastestGrowing,
    businessHealthRankings: {
      id: "business-health",
      title: "Business health rankings",
      rows: healthTable.rows,
      total: healthTable.total,
      page: healthTable.page,
      pageSize,
      totalPages: healthTable.totalPages,
    },
    alerts: buildAlerts(metrics),
    recommendations: buildRecommendations(metrics, rankings),
    operationalInsights: buildOperationalInsights(metrics),
    permissions,
    range,
    comparePrevious,
    refreshedAt: new Date().toISOString(),
  };
}

export async function exportPlatformIntelligence(
  operator: ControlCenterOperatorContext,
  query: PlatformIntelligenceQuery = {},
  format: "csv" | "json" = "json",
): Promise<{ filename: string; content: string; mimeType: string }> {
  const bundle = await getPlatformIntelligenceBundle(operator, query);

  if (format === "json") {
    return {
      filename: `platform-intelligence-${bundle.range}.json`,
      content: JSON.stringify(bundle, null, 2),
      mimeType: "application/json",
    };
  }

  const rows = [
    "Score,Value,Previous,Growth %",
    ...bundle.platformScores.map(
      (score) =>
        `${score.label},${score.value},${score.previousValue ?? ""},${score.growthPct ?? ""}`,
    ),
  ];

  return {
    filename: `platform-intelligence-${bundle.range}.csv`,
    content: rows.join("\n"),
    mimeType: "text/csv",
  };
}
