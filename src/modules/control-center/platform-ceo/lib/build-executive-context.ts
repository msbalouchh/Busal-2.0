import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { buildOperatorPlatformContext } from "@/modules/control-center/platform-admin/lib/build-operator-platform-context";
import { loadOperatorRegistry } from "@/modules/control-center/operators/repository/control-center-operator.repository";
import type { PlatformIntelligenceBundle } from "@/modules/control-center/platform-intelligence/types/platform-intelligence-types";
import type {
  PlatformCeoExecutiveContext,
  PlatformCeoMemory,
} from "@/modules/control-center/platform-ceo/types/platform-ceo.types";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";
import { getPlatformIntelligenceBundle } from "@/services/control-center-platform-intelligence.service";
import { prisma } from "@/lib/prisma";

function scoreMap(bundle: PlatformIntelligenceBundle): Record<string, unknown> {
  return Object.fromEntries(
    bundle.platformScores.map((score) => [
      score.id,
      {
        label: score.label,
        value: score.value,
        previousValue: score.previousValue,
        growthPct: score.growthPct,
        format: score.format,
      },
    ]),
  );
}

function rankingSnapshot(
  rows: PlatformIntelligenceBundle["topBusinesses"],
): Record<string, unknown> {
  return {
    count: rows.length,
    items: rows.slice(0, 10).map((row) => ({
      id: row.id,
      name: row.name,
      workspaceId: row.workspaceId,
      metric: row.metric,
      metricLabel: row.metricLabel,
      riskLevel: row.riskLevel,
    })),
  };
}

export async function buildPlatformCeoExecutiveContext(
  operator: ControlCenterOperatorContext,
  memory: PlatformCeoMemory,
): Promise<PlatformCeoExecutiveContext> {
  const intelligence = await getPlatformIntelligenceBundle(operator, {
    range: 30,
    comparePrevious: true,
  });

  const [businessCount, operatorRegistry, platformContext] = await Promise.all([
    prisma.business.count(),
    loadOperatorRegistry(),
    buildOperatorPlatformContext(operator),
  ]);

  const scores = scoreMap(intelligence);
  const uniqueWorkspaceIds = new Set(
    [
      ...intelligence.topBusinesses,
      ...intelligence.atRiskBusinesses,
      ...intelligence.dormantBusinesses,
      ...intelligence.fastestGrowing,
    ].map((row) => row.workspaceId),
  );

  return {
    generatedAt: new Date().toISOString(),
    operator: {
      userId: operator.userId,
      email: operator.email,
      fullName: operator.fullName,
      permissions: operator.permissions,
    },
    platform: {
      environment: operator.environment,
      businessCount,
      workspaceCount: uniqueWorkspaceIds.size,
      operatorCount: operatorRegistry.length,
      refreshedAt: intelligence.refreshedAt,
      businessId: platformContext.business.id,
      businessName: platformContext.business.businessName ?? "Platform",
    },
    businesses: {
      top: rankingSnapshot(intelligence.topBusinesses),
      atRisk: rankingSnapshot(intelligence.atRiskBusinesses),
      dormant: rankingSnapshot(intelligence.dormantBusinesses),
      fastestGrowing: rankingSnapshot(intelligence.fastestGrowing),
      healthRankings: intelligence.businessHealthRankings,
    },
    workspaces: {
      total: uniqueWorkspaceIds.size,
      drillDownSupported: true,
    },
    operators: {
      total: operatorRegistry.length,
      active: operatorRegistry.filter((entry) => entry.status === "active").length,
      roles: operatorRegistry.reduce<Record<string, number>>((accumulator, entry) => {
        accumulator[entry.role] = (accumulator[entry.role] ?? 0) + 1;
        return accumulator;
      }, {}),
    },
    revenue: {
      scores: scores,
      forecast: intelligence.trends.find((series) => series.id.includes("revenue")) ?? null,
    },
    subscriptions: {
      commercialSignals: intelligence.operationalInsights.filter((insight) =>
        insight.toLowerCase().includes("subscription"),
      ),
    },
    platformHealth: {
      score: intelligence.platformScores.find((score) => score.id === "platform-health") ?? null,
      capacity:
        intelligence.platformScores.find((score) => score.id === "system-capacity") ?? null,
      alerts: intelligence.alerts,
    },
    growth: {
      score: intelligence.platformScores.find((score) => score.id === "growth") ?? null,
      fastestGrowing: rankingSnapshot(intelligence.fastestGrowing),
      trends: intelligence.trends,
    },
    churn: {
      score: intelligence.platformScores.find((score) => score.id === "churn-risk") ?? null,
      atRisk: rankingSnapshot(intelligence.atRiskBusinesses),
    },
    security: {
      score: intelligence.platformScores.find((score) => score.id === "security-risk") ?? null,
      alerts: intelligence.alerts.filter(
        (alert) =>
          alert.module?.toLowerCase().includes("security") ||
          alert.title.toLowerCase().includes("security"),
      ),
    },
    monitoring: {
      alerts: intelligence.alerts,
      operationalInsights: intelligence.operationalInsights,
    },
    aiUsage: {
      score: intelligence.platformScores.find((score) => score.id === "ai-adoption") ?? null,
      adoptionInsights: intelligence.operationalInsights.filter((insight) =>
        insight.toLowerCase().includes("ai"),
      ),
    },
    featureFlags: {
      score:
        intelligence.platformScores.find((score) => score.id === "feature-adoption") ?? null,
      canManage: hasPermission(
        new Set(operator.permissions),
        PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS,
      ),
    },
    support: {
      score: intelligence.platformScores.find((score) => score.id === "support-health") ?? null,
      alerts: intelligence.alerts.filter(
        (alert) =>
          alert.module?.toLowerCase().includes("support") ||
          alert.title.toLowerCase().includes("support"),
      ),
    },
    commercial: {
      executiveSummary: intelligence.executiveSummary,
      recommendations: intelligence.recommendations,
    },
    intelligenceSummary: {
      weekly: intelligence.executiveSummary.weekly,
      monthly: intelligence.executiveSummary.monthly,
      recommendations: intelligence.recommendations.map((rec) => ({
        id: rec.id,
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        actionLabel: rec.actionLabel,
      })),
      operationalInsights: intelligence.operationalInsights,
      scores: intelligence.platformScores.map((score) => ({
        id: score.id,
        label: score.label,
        value: score.value,
        format: score.format,
      })),
    },
    memory,
  };
}
