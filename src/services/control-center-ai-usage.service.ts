import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import {
  AI_USAGE_PAGE_SIZE,
  AI_USAGE_SECTIONS,
} from "@/modules/control-center/ai-usage/constants/control-center-ai-usage";
import {
  aggregateAiUsageMetrics,
  buildAiUsageDateWindow,
  computeGrowthPct,
  loadBusinessBreakdown,
  loadCostDailyTrend,
  loadAiUsageFilterOptions,
  loadModelBreakdown,
  loadModuleBreakdown,
  loadProviderBreakdown,
  loadRecentExecutions,
  loadRequestDailyTrend,
  loadTokenDailyTrend,
  loadTokenMonthlyTrend,
} from "@/modules/control-center/ai-usage/repository/control-center-ai-usage.repository";
import type {
  ControlCenterAiUsageBundle,
  ControlCenterAiUsageKpi,
  ControlCenterAiUsagePermissions,
  ControlCenterAiUsageQuery,
  ControlCenterAiUsageRange,
  ControlCenterAiUsageSection,
  ControlCenterAiUsageTable,
} from "@/modules/control-center/ai-usage/types/control-center-ai-usage-types";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";

function buildPermissions(operator: ControlCenterOperatorContext): ControlCenterAiUsagePermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);
  const canView =
    hasAdmin ||
    hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_AI) ||
    hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_VIEW);

  return { canView, canExport: canView };
}

function makeKpi(
  id: string,
  label: string,
  value: number,
  previousValue: number | null,
  format: ControlCenterAiUsageKpi["format"] = "number",
): ControlCenterAiUsageKpi {
  return {
    id,
    label,
    value,
    previousValue,
    growthPct: previousValue === null ? null : computeGrowthPct(value, previousValue),
    format,
  };
}

function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total, totalPages, page: safePage };
}

function buildSections(
  metrics: Awaited<ReturnType<typeof aggregateAiUsageMetrics>>,
  breakdowns: {
    providers: Awaited<ReturnType<typeof loadProviderBreakdown>>;
    models: Awaited<ReturnType<typeof loadModelBreakdown>>;
    businesses: Awaited<ReturnType<typeof loadBusinessBreakdown>>;
    modules: Awaited<ReturnType<typeof loadModuleBreakdown>>;
    recentExecutions: Awaited<ReturnType<typeof loadRecentExecutions>>;
  },
  trends: {
    tokenDaily: Awaited<ReturnType<typeof loadTokenDailyTrend>>;
    requestDaily: Awaited<ReturnType<typeof loadRequestDailyTrend>>;
    costDaily: Awaited<ReturnType<typeof loadCostDailyTrend>>;
    tokenMonthly: Awaited<ReturnType<typeof loadTokenMonthlyTrend>>;
  },
  query: ControlCenterAiUsageQuery,
  comparePrevious: boolean,
): ControlCenterAiUsageSection[] {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? AI_USAGE_PAGE_SIZE;
  const previous = comparePrevious ? metrics.previousRequests : null;

  const providerTable = paginateRows(breakdowns.providers, page, pageSize);
  const modelTable = paginateRows(breakdowns.models, 1, pageSize);
  const businessTable = paginateRows(breakdowns.businesses, page, pageSize);
  const moduleTable = paginateRows(breakdowns.modules, 1, pageSize);
  const executionTable = paginateRows(breakdowns.recentExecutions, 1, pageSize);

  const sectionMap: Record<string, ControlCenterAiUsageSection> = {
    overview: {
      id: "overview",
      title: "Executive AI Overview",
      description: "Platform-wide AI requests, tokens, cost, and reliability.",
      kpis: [
        makeKpi("requests", "AI Requests", metrics.totalRequests, previous),
        makeKpi("tokens", "AI Tokens", metrics.totalTokens, null),
        makeKpi("cost", "AI Cost", metrics.totalCostCents, null, "currency"),
        makeKpi("conversations", "Conversations", metrics.conversations, null),
        makeKpi("tool-executions", "Tool Executions", metrics.toolExecutions, null),
        makeKpi("memory", "Memory Records", metrics.memoryRecords, null),
        makeKpi("success-rate", "Success Rate", metrics.successRate, null, "rate"),
        makeKpi("cache-hit-rate", "Cache Hit Rate", metrics.cacheHitRate, null, "rate"),
      ],
      trends: [
        { id: "requests", label: "Daily requests", points: trends.requestDaily },
        { id: "tokens", label: "Daily tokens", points: trends.tokenDaily },
      ],
      monthlyTrends: trends.tokenMonthly,
      tables: [],
    },
    providers: {
      id: "providers",
      title: "Provider Analytics",
      description: "Usage and cost breakdown by AI provider.",
      kpis: breakdowns.providers.slice(0, 4).map((row) =>
        makeKpi(row.provider, row.provider, row.tokens, null),
      ),
      trends: [{ id: "cost", label: "Daily cost", points: trends.costDaily }],
      monthlyTrends: [],
      tables: [
        {
          id: "providers",
          title: "Provider Usage",
          rows: providerTable.rows.map((row) => ({
            id: row.id,
            primary: row.provider,
            secondary: `${row.requests.toLocaleString()} requests`,
            metric: `${row.tokens.toLocaleString()} tokens`,
            metricLabel: "Tokens",
          })),
          total: providerTable.total,
          page: providerTable.page,
          pageSize,
          totalPages: providerTable.totalPages,
        },
      ],
    },
    models: {
      id: "models",
      title: "Model Analytics",
      description: "Token and request distribution by model.",
      kpis: [
        makeKpi("models", "Active Models", breakdowns.models.length, null),
        makeKpi("top-model-tokens", "Top Model Tokens", breakdowns.models[0]?.tokens ?? 0, null),
      ],
      trends: [{ id: "tokens", label: "Daily tokens", points: trends.tokenDaily }],
      monthlyTrends: [],
      tables: [
        {
          id: "models",
          title: "Model Usage",
          rows: modelTable.rows.map((row) => ({
            id: row.id,
            primary: row.model,
            secondary: row.provider,
            metric: row.tokens.toLocaleString(),
            metricLabel: "Tokens",
          })),
          total: modelTable.total,
          page: 1,
          pageSize,
          totalPages: modelTable.totalPages,
        },
      ],
    },
    businesses: {
      id: "businesses",
      title: "Business Analytics",
      description: "AI consumption by business, tenant, and workspace.",
      kpis: [
        makeKpi("businesses", "Active Businesses", breakdowns.businesses.length, null),
        makeKpi(
          "top-business-tokens",
          "Top Business Tokens",
          breakdowns.businesses[0]?.tokens ?? 0,
          null,
        ),
      ],
      trends: [{ id: "requests", label: "Daily requests", points: trends.requestDaily }],
      monthlyTrends: trends.tokenMonthly,
      tables: [
        {
          id: "businesses",
          title: "Business / Workspace Usage",
          rows: businessTable.rows.map((row) => ({
            id: row.id,
            primary: row.name,
            secondary: `${row.email} · ${row.workspaceId}`,
            metric: `${row.tokens.toLocaleString()} tokens · £${(row.costCents / 100).toFixed(2)}`,
            metricLabel: "Usage",
          })),
          total: businessTable.total,
          page: businessTable.page,
          pageSize,
          totalPages: businessTable.totalPages,
        },
      ],
    },
    modules: {
      id: "modules",
      title: "Module Analytics",
      description: "Tool and agent activity grouped by platform module.",
      kpis: [
        makeKpi("modules", "Active Modules", breakdowns.modules.length, null),
        makeKpi(
          "top-module-requests",
          "Top Module Requests",
          breakdowns.modules[0]?.requests ?? 0,
          null,
        ),
      ],
      trends: [{ id: "requests", label: "Daily requests", points: trends.requestDaily }],
      monthlyTrends: [],
      tables: [
        {
          id: "modules",
          title: "Module Usage",
          rows: moduleTable.rows.map((row) => ({
            id: row.id,
            primary: row.module,
            secondary: `${row.requests.toLocaleString()} requests`,
            metric: `${row.failureRate}% fail`,
            metricLabel: "Failure rate",
          })),
          total: moduleTable.total,
          page: 1,
          pageSize,
          totalPages: moduleTable.totalPages,
        },
      ],
    },
    performance: {
      id: "performance",
      title: "Performance",
      description: "Response times, success rates, and cache efficiency.",
      kpis: [
        makeKpi("avg-response", "Avg Response Time", metrics.avgResponseMs, null, "duration"),
        makeKpi("success-rate", "Success Rate", metrics.successRate, null, "rate"),
        makeKpi("failure-rate", "Failure Rate", metrics.failureRate, null, "rate"),
        makeKpi("cache-hit-rate", "Cache Hit Rate", metrics.cacheHitRate, null, "rate"),
      ],
      trends: [{ id: "requests", label: "Daily requests", points: trends.requestDaily }],
      monthlyTrends: [],
      tables: [
        {
          id: "recent-executions",
          title: "Recent Tool Executions",
          rows: executionTable.rows.map((row) => ({
            id: row.id,
            primary: row.tool.name,
            secondary: row.business.businessName ?? "—",
            metric: row.status,
            metricLabel: "Status",
          })),
          total: executionTable.total,
          page: 1,
          pageSize,
          totalPages: executionTable.totalPages,
        },
      ],
    },
    costs: {
      id: "costs",
      title: "Costs",
      description: "Prompt, completion, and total AI spend.",
      kpis: [
        makeKpi("total-cost", "Total AI Cost", metrics.totalCostCents, null, "currency"),
        makeKpi("prompt-cost", "Prompt Cost", metrics.promptCostCents, null, "currency"),
        makeKpi("completion-cost", "Completion Cost", metrics.completionCostCents, null, "currency"),
      ],
      trends: [{ id: "cost", label: "Daily cost", points: trends.costDaily }],
      monthlyTrends: trends.tokenMonthly.map((point) => ({
        month: point.month,
        value: point.value,
      })),
      tables: [],
    },
    trends: {
      id: "trends",
      title: "Usage Trends",
      description: "Daily and monthly AI usage patterns.",
      kpis: [
        makeKpi("daily-avg-requests", "Avg Daily Requests", Math.round(
          trends.requestDaily.reduce((sum, p) => sum + p.value, 0) /
            Math.max(trends.requestDaily.length, 1),
        ), null),
        makeKpi("daily-avg-tokens", "Avg Daily Tokens", Math.round(
          trends.tokenDaily.reduce((sum, p) => sum + p.value, 0) /
            Math.max(trends.tokenDaily.length, 1),
        ), null),
      ],
      trends: [
        { id: "tokens", label: "Daily tokens", points: trends.tokenDaily },
        { id: "cost", label: "Daily cost", points: trends.costDaily },
      ],
      monthlyTrends: trends.tokenMonthly,
      tables: [],
    },
    growth: {
      id: "growth",
      title: "Growth",
      description: "Period-over-period AI adoption and expansion.",
      kpis: [
        makeKpi("requests", "AI Requests", metrics.totalRequests, previous),
        makeKpi("tokens", "AI Tokens", metrics.totalTokens, null),
        makeKpi("conversations", "Conversations", metrics.conversations, null),
      ],
      trends: [
        { id: "requests", label: "Daily requests", points: trends.requestDaily },
        { id: "tokens", label: "Daily tokens", points: trends.tokenDaily },
      ],
      monthlyTrends: trends.tokenMonthly,
      tables: [],
    },
  };

  const selectedSection = query.section?.trim();
  if (selectedSection && sectionMap[selectedSection]) {
    return [sectionMap[selectedSection]];
  }

  return AI_USAGE_SECTIONS.map((section) => sectionMap[section.id]!);
}

export async function getControlCenterAiUsageBundle(
  operator: ControlCenterOperatorContext,
  query: ControlCenterAiUsageQuery = {},
): Promise<ControlCenterAiUsageBundle> {
  const permissions = buildPermissions(operator);
  const rangeDays = (query.rangeDays ?? 30) as ControlCenterAiUsageRange;
  const comparePrevious = query.comparePrevious ?? true;
  const window = buildAiUsageDateWindow(rangeDays);

  const [
    metrics,
    filterOptions,
    providers,
    models,
    businesses,
    modules,
    recentExecutions,
    tokenDaily,
    requestDaily,
    costDaily,
    tokenMonthly,
  ] = await Promise.all([
    aggregateAiUsageMetrics(window, query),
    loadAiUsageFilterOptions(),
    loadProviderBreakdown(window, query),
    loadModelBreakdown(window, query),
    loadBusinessBreakdown(window, query),
    loadModuleBreakdown(window, query),
    loadRecentExecutions(window, query, 20),
    loadTokenDailyTrend(rangeDays, query),
    loadRequestDailyTrend(rangeDays, query),
    loadCostDailyTrend(rangeDays, query),
    loadTokenMonthlyTrend(query),
  ]);

  const previous = comparePrevious ? metrics.previousRequests : null;

  const executiveKpis: ControlCenterAiUsageKpi[] = [
    makeKpi("requests", "AI Requests", metrics.totalRequests, previous),
    makeKpi("tokens", "AI Tokens", metrics.totalTokens, null),
    makeKpi("cost", "AI Cost", metrics.totalCostCents, null, "currency"),
    makeKpi("avg-response", "Avg Response", metrics.avgResponseMs, null, "duration"),
    makeKpi("success-rate", "Success Rate", metrics.successRate, null, "rate"),
    makeKpi("failure-rate", "Failure Rate", metrics.failureRate, null, "rate"),
    makeKpi("cache-hit-rate", "Cache Hit Rate", metrics.cacheHitRate, null, "rate"),
    makeKpi("conversations", "Conversations", metrics.conversations, null),
  ];

  const sections = buildSections(
    metrics,
    { providers, models, businesses, modules, recentExecutions },
    { tokenDaily, requestDaily, costDaily, tokenMonthly },
    query,
    comparePrevious,
  );

  return {
    executiveKpis,
    sections,
    permissions,
    filterOptions,
    rangeDays,
    comparePrevious,
    refreshedAt: new Date().toISOString(),
  };
}

export async function exportControlCenterAiUsage(
  operator: ControlCenterOperatorContext,
  query: ControlCenterAiUsageQuery = {},
  format: "csv" | "json" = "json",
): Promise<{ filename: string; content: string; mimeType: string }> {
  const bundle = await getControlCenterAiUsageBundle(operator, query);

  if (format === "json") {
    return {
      filename: `ai-usage-${bundle.rangeDays}d.json`,
      content: JSON.stringify(bundle, null, 2),
      mimeType: "application/json",
    };
  }

  const rows: string[] = [
    "Section,KPI,Value,Previous,Growth %",
    ...bundle.executiveKpis.map(
      (kpi) =>
        `Executive,${kpi.label},${kpi.value},${kpi.previousValue ?? ""},${kpi.growthPct ?? ""}`,
    ),
    ...bundle.sections.flatMap((section) =>
      section.kpis.map(
        (kpi) =>
          `${section.title},${kpi.label},${kpi.value},${kpi.previousValue ?? ""},${kpi.growthPct ?? ""}`,
      ),
    ),
  ];

  return {
    filename: `ai-usage-${bundle.rangeDays}d.csv`,
    content: rows.join("\n"),
    mimeType: "text/csv",
  };
}

export type { ControlCenterAiUsageTable };
