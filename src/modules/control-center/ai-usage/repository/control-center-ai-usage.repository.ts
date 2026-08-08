import "server-only";

import { prisma } from "@/lib/prisma";
import { AI_TOKEN_COST_PENCE_ESTIMATE } from "@/modules/control-center/ai-usage/constants/control-center-ai-usage";
import type {
  ControlCenterAiUsageQuery,
  ControlCenterAiUsageRange,
} from "@/modules/control-center/ai-usage/types/control-center-ai-usage-types";

export interface AiUsageDateWindow {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  days: ControlCenterAiUsageRange;
}

export function inferAiProvider(model: string | null | undefined): string {
  if (!model?.trim()) return "unknown";
  const lower = model.toLowerCase();
  if (lower.includes("gpt") || lower.includes("openai") || lower.includes("o1") || lower.includes("o3")) {
    return "openai";
  }
  if (lower.includes("claude") || lower.includes("anthropic")) return "anthropic";
  if (lower.includes("gemini") || lower.includes("google")) return "google";
  if (lower.includes("llama") || lower.includes("meta")) return "meta";
  if (lower.includes("mistral")) return "mistral";
  if (lower.includes("local") || lower.includes("ollama")) return "local";
  return "other";
}

export function buildAiUsageDateWindow(days: ControlCenterAiUsageRange): AiUsageDateWindow {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const previousEnd = new Date(start);
  previousEnd.setMilliseconds(-1);

  const previousStart = new Date(previousEnd);
  previousStart.setHours(0, 0, 0, 0);
  previousStart.setDate(previousStart.getDate() - (days - 1));

  return { start, end, previousStart, previousEnd, days };
}

export function computeGrowthPct(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function buildExecutionWhere(
  window: AiUsageDateWindow,
  query: ControlCenterAiUsageQuery,
  usePrevious = false,
) {
  const range = usePrevious
    ? { gte: window.previousStart, lt: window.previousEnd }
    : { gte: window.start, lt: window.end };

  const where: {
    createdAt: { gte: Date; lt: Date };
    businessId?: string;
    modelUsed?: string;
  } = { createdAt: range };

  if (query.businessId?.trim()) {
    where.businessId = query.businessId.trim();
  }

  if (query.model?.trim()) {
    where.modelUsed = query.model.trim();
  }

  return where;
}

function buildAgentWhere(window: AiUsageDateWindow, query: ControlCenterAiUsageQuery, usePrevious = false) {
  const range = usePrevious
    ? { gte: window.previousStart, lt: window.previousEnd }
    : { gte: window.start, lt: window.end };

  const where: {
    createdAt: { gte: Date; lt: Date };
    businessId?: string;
  } = { createdAt: range };

  if (query.businessId?.trim()) {
    where.businessId = query.businessId.trim();
  }

  return where;
}

export async function buildDailyTrend(
  days: ControlCenterAiUsageRange,
  counter: (dayStart: Date, dayEnd: Date) => Promise<number>,
): Promise<Array<{ day: string; value: number }>> {
  const points: Array<{ day: string; value: number }> = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - offset);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    points.push({
      day: dayStart.toISOString().slice(0, 10),
      value: await counter(dayStart, dayEnd),
    });
  }

  return points;
}

export async function buildMonthlyTrend(
  months: number,
  counter: (monthStart: Date, monthEnd: Date) => Promise<number>,
): Promise<Array<{ month: string; value: number }>> {
  const points: Array<{ month: string; value: number }> = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    monthStart.setMonth(monthStart.getMonth() - offset);

    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    points.push({
      month: monthStart.toISOString().slice(0, 7),
      value: await counter(monthStart, monthEnd),
    });
  }

  return points;
}

export async function loadAiUsageFilterOptions(): Promise<{
  providers: string[];
  businesses: Array<{ id: string; name: string }>;
  models: string[];
  modules: string[];
}> {
  const [toolModels, businesses, modules] = await Promise.all([
    prisma.aiToolExecution.findMany({
      where: { modelUsed: { not: null } },
      select: { modelUsed: true },
      distinct: ["modelUsed"],
      take: 50,
    }),
    prisma.business.findMany({
      select: { id: true, businessName: true },
      orderBy: { businessName: "asc" },
      take: 200,
    }),
    prisma.aiTool.findMany({
      select: { module: true },
      distinct: ["module"],
      take: 50,
    }),
  ]);

  const models = toolModels
    .map((row) => row.modelUsed)
    .filter((value): value is string => Boolean(value?.trim()));

  const providers = Array.from(new Set(models.map((model) => inferAiProvider(model)))).sort();

  return {
    providers,
    businesses: businesses.map((business) => ({
      id: business.id,
      name: business.businessName ?? "Untitled",
    })),
    models: models.sort(),
    modules: modules.map((row) => row.module).filter(Boolean).sort(),
  };
}

export async function aggregateAiUsageMetrics(
  window: AiUsageDateWindow,
  query: ControlCenterAiUsageQuery,
) {
  const toolWhere = buildExecutionWhere(window, query);
  const agentWhere = buildAgentWhere(window, query);
  const previousToolWhere = buildExecutionWhere(window, query, true);
  const previousAgentWhere = buildAgentWhere(window, query, true);

  const moduleFilter = query.module?.trim()
    ? { tool: { module: query.module.trim() } }
    : undefined;

  const providerFilter = query.provider?.trim()
    ? { modelUsed: { contains: query.provider.trim(), mode: "insensitive" as const } }
    : undefined;

  const combinedToolWhere = {
    ...toolWhere,
    ...moduleFilter,
    ...(providerFilter ? { modelUsed: providerFilter.modelUsed } : {}),
  };

  const [
    toolExecutions,
    agentExecutions,
    platformAgentExecutions,
    skillExecutions,
    conversations,
    memories,
    agentMemories,
    toolAgg,
    agentAgg,
    previousToolCount,
    previousAgentCount,
    toolSuccess,
    toolFailed,
    agentSuccess,
    agentFailed,
    perfLogs,
    cacheSnapshots,
  ] = await Promise.all([
    prisma.aiToolExecution.count({ where: combinedToolWhere }),
    prisma.aiAgentExecution.count({ where: agentWhere }),
    prisma.aIAgentExecution.count({ where: { createdAt: toolWhere.createdAt, ...(query.businessId ? { businessId: query.businessId } : {}) } }),
    prisma.aISkillExecution.count({ where: { createdAt: toolWhere.createdAt, ...(query.businessId ? { businessId: query.businessId } : {}) } }),
    prisma.aIConversation.count({ where: { createdAt: toolWhere.createdAt, ...(query.businessId ? { businessId: query.businessId } : {}) } }),
    prisma.aIMemory.count({ where: { createdAt: toolWhere.createdAt, ...(query.businessId ? { businessId: query.businessId } : {}) } }),
    prisma.aiAgentMemory.count({ where: { createdAt: toolWhere.createdAt, ...(query.businessId ? { businessId: query.businessId } : {}) } }),
    prisma.aiToolExecution.aggregate({
      where: combinedToolWhere,
      _sum: { tokensUsed: true, executionTimeMs: true },
      _avg: { executionTimeMs: true },
      _count: { _all: true },
    }),
    prisma.aiAgentExecution.aggregate({
      where: agentWhere,
      _sum: { tokensUsed: true, costCents: true, knowledgeHits: true, toolCalls: true },
      _avg: { durationMs: true },
      _count: { _all: true },
    }),
    prisma.aiToolExecution.count({ where: { ...previousToolWhere, ...moduleFilter } }),
    prisma.aiAgentExecution.count({ where: previousAgentWhere }),
    prisma.aiToolExecution.count({ where: { ...combinedToolWhere, status: "SUCCESS" } }),
    prisma.aiToolExecution.count({ where: { ...combinedToolWhere, status: "FAILED" } }),
    prisma.aiAgentExecution.count({ where: { ...agentWhere, status: "COMPLETED" } }),
    prisma.aiAgentExecution.count({ where: { ...agentWhere, status: "FAILED" } }),
    prisma.monitoringPerformanceLog.findMany({
      where: {
        category: "AI",
        createdAt: toolWhere.createdAt,
        ...(query.businessId ? { businessId: query.businessId } : {}),
      },
      select: { durationMs: true },
      take: 5000,
    }),
    prisma.monitoringMetricSnapshot.aggregate({
      where: {
        capturedAt: toolWhere.createdAt,
        ...(query.businessId ? { businessId: query.businessId } : {}),
      },
      _avg: { cacheHitRate: true },
    }),
  ]);

  const toolTokens = toolAgg._sum.tokensUsed ?? 0;
  const agentTokens = agentAgg._sum.tokensUsed ?? 0;
  const totalTokens = toolTokens + agentTokens;
  const agentCostCents = agentAgg._sum.costCents ?? 0;
  const estimatedToolCostCents = Math.round(toolTokens * AI_TOKEN_COST_PENCE_ESTIMATE);
  const totalCostCents = agentCostCents + estimatedToolCostCents;
  const promptCostCents = Math.round(totalCostCents * 0.4);
  const completionCostCents = totalCostCents - promptCostCents;

  const totalRequests =
    toolExecutions + agentExecutions + platformAgentExecutions + skillExecutions;
  const previousRequests = previousToolCount + previousAgentCount;

  const successCount = toolSuccess + agentSuccess;
  const failureCount = toolFailed + agentFailed;
  const completedTotal = successCount + failureCount;
  const successRate = completedTotal === 0 ? 100 : Math.round((successCount / completedTotal) * 1000) / 10;
  const failureRate = completedTotal === 0 ? 0 : Math.round((failureCount / completedTotal) * 1000) / 10;

  const avgToolMs = toolAgg._avg.executionTimeMs ?? 0;
  const avgAgentMs = agentAgg._avg.durationMs ?? 0;
  const perfAvg =
    perfLogs.length > 0
      ? perfLogs.reduce((sum, log) => sum + log.durationMs, 0) / perfLogs.length
      : 0;
  const avgResponseMs = Math.round(
    perfAvg || (avgToolMs && avgAgentMs ? (avgToolMs + avgAgentMs) / 2 : avgToolMs || avgAgentMs),
  );

  const knowledgeHits = agentAgg._sum.knowledgeHits ?? 0;
  const cacheHitRate =
    cacheSnapshots._avg.cacheHitRate !== null && cacheSnapshots._avg.cacheHitRate !== undefined
      ? Math.round(cacheSnapshots._avg.cacheHitRate * 1000) / 10
      : agentExecutions === 0
        ? 0
        : Math.round((knowledgeHits / agentExecutions) * 1000) / 10;

  return {
    totalRequests,
    previousRequests,
    totalTokens,
    totalCostCents,
    promptCostCents,
    completionCostCents,
    toolExecutions,
    agentExecutions,
    platformAgentExecutions,
    skillExecutions,
    conversations,
    memoryRecords: memories + agentMemories,
    successRate,
    failureRate,
    avgResponseMs,
    cacheHitRate,
    knowledgeHits,
    toolCalls: agentAgg._sum.toolCalls ?? 0,
  };
}

export async function loadProviderBreakdown(window: AiUsageDateWindow, query: ControlCenterAiUsageQuery) {
  const toolWhere = buildExecutionWhere(window, query);
  const executions = await prisma.aiToolExecution.findMany({
    where: toolWhere,
    select: { modelUsed: true, tokensUsed: true, status: true },
    take: 5000,
  });

  const buckets = new Map<string, { requests: number; tokens: number; failures: number }>();

  for (const execution of executions) {
    const provider = inferAiProvider(execution.modelUsed);
    if (query.provider?.trim() && provider !== query.provider.trim()) continue;

    const current = buckets.get(provider) ?? { requests: 0, tokens: 0, failures: 0 };
    current.requests += 1;
    current.tokens += execution.tokensUsed ?? 0;
    if (execution.status === "FAILED") current.failures += 1;
    buckets.set(provider, current);
  }

  return Array.from(buckets.entries())
    .map(([provider, stats]) => ({
      id: provider,
      provider,
      requests: stats.requests,
      tokens: stats.tokens,
      failureRate: stats.requests === 0 ? 0 : Math.round((stats.failures / stats.requests) * 1000) / 10,
      costCents: Math.round(stats.tokens * AI_TOKEN_COST_PENCE_ESTIMATE),
    }))
    .sort((a, b) => b.tokens - a.tokens);
}

export async function loadModelBreakdown(window: AiUsageDateWindow, query: ControlCenterAiUsageQuery) {
  const toolWhere = buildExecutionWhere(window, query);
  const grouped = await prisma.aiToolExecution.groupBy({
    by: ["modelUsed"],
    where: {
      ...toolWhere,
      modelUsed: query.model?.trim() ? query.model.trim() : { not: null },
    },
    _count: { _all: true },
    _sum: { tokensUsed: true },
  });

  return grouped
    .filter((row) => row.modelUsed)
    .map((row) => ({
      id: row.modelUsed!,
      model: row.modelUsed!,
      provider: inferAiProvider(row.modelUsed),
      requests: row._count._all,
      tokens: row._sum.tokensUsed ?? 0,
      costCents: Math.round((row._sum.tokensUsed ?? 0) * AI_TOKEN_COST_PENCE_ESTIMATE),
    }))
    .filter((row) => !query.provider?.trim() || row.provider === query.provider.trim())
    .sort((a, b) => b.tokens - a.tokens);
}

export async function loadBusinessBreakdown(window: AiUsageDateWindow, query: ControlCenterAiUsageQuery) {
  const toolWhere = buildExecutionWhere(window, query);
  const agentWhere = buildAgentWhere(window, query);

  const [toolGroups, agentGroups] = await Promise.all([
    prisma.aiToolExecution.groupBy({
      by: ["businessId"],
      where: toolWhere,
      _count: { _all: true },
      _sum: { tokensUsed: true },
    }),
    prisma.aiAgentExecution.groupBy({
      by: ["businessId"],
      where: agentWhere,
      _count: { _all: true },
      _sum: { tokensUsed: true, costCents: true },
    }),
  ]);

  const merged = new Map<
    string,
    { requests: number; tokens: number; costCents: number }
  >();

  for (const group of toolGroups) {
    merged.set(group.businessId, {
      requests: group._count._all,
      tokens: group._sum.tokensUsed ?? 0,
      costCents: Math.round((group._sum.tokensUsed ?? 0) * AI_TOKEN_COST_PENCE_ESTIMATE),
    });
  }

  for (const group of agentGroups) {
    const current = merged.get(group.businessId) ?? { requests: 0, tokens: 0, costCents: 0 };
    current.requests += group._count._all;
    current.tokens += group._sum.tokensUsed ?? 0;
    current.costCents += group._sum.costCents ?? 0;
    merged.set(group.businessId, current);
  }

  const businessIds = Array.from(merged.keys());
  const businesses = await prisma.business.findMany({
    where: {
      id: { in: businessIds },
      ...(query.search?.trim()
        ? {
            OR: [
              { businessName: { contains: query.search.trim(), mode: "insensitive" } },
              { owner: { email: { contains: query.search.trim(), mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: { id: true, businessName: true, owner: { select: { email: true } } },
  });

  const businessMap = new Map(businesses.map((b) => [b.id, b]));

  return Array.from(merged.entries())
    .map(([businessId, stats]) => {
      const business = businessMap.get(businessId);
      if (!business) return null;
      return {
        id: businessId,
        name: business.businessName ?? "Untitled",
        email: business.owner.email,
        workspaceId: `${businessId}-ws`,
        requests: stats.requests,
        tokens: stats.tokens,
        costCents: stats.costCents,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.tokens - a.tokens);
}

export async function loadModuleBreakdown(window: AiUsageDateWindow, query: ControlCenterAiUsageQuery) {
  const toolWhere = buildExecutionWhere(window, query);
  const executions = await prisma.aiToolExecution.findMany({
    where: {
      ...toolWhere,
      ...(query.module?.trim() ? { tool: { module: query.module.trim() } } : {}),
    },
    select: {
      tokensUsed: true,
      status: true,
      tool: { select: { module: true } },
    },
    take: 5000,
  });

  const buckets = new Map<string, { requests: number; tokens: number; failures: number }>();

  for (const execution of executions) {
    const moduleName = execution.tool.module || "unknown";
    const current = buckets.get(moduleName) ?? { requests: 0, tokens: 0, failures: 0 };
    current.requests += 1;
    current.tokens += execution.tokensUsed ?? 0;
    if (execution.status === "FAILED") current.failures += 1;
    buckets.set(moduleName, current);
  }

  return Array.from(buckets.entries())
    .map(([moduleName, stats]) => ({
      id: moduleName,
      module: moduleName,
      requests: stats.requests,
      tokens: stats.tokens,
      failureRate: stats.requests === 0 ? 0 : Math.round((stats.failures / stats.requests) * 1000) / 10,
    }))
    .sort((a, b) => b.requests - a.requests);
}

export async function loadTokenDailyTrend(
  days: ControlCenterAiUsageRange,
  query: ControlCenterAiUsageQuery,
) {
  return buildDailyTrend(days, async (dayStart, dayEnd) => {
    const where = {
      createdAt: { gte: dayStart, lt: dayEnd },
      ...(query.businessId ? { businessId: query.businessId } : {}),
    };
    const [tools, agents] = await Promise.all([
      prisma.aiToolExecution.aggregate({ where, _sum: { tokensUsed: true } }),
      prisma.aiAgentExecution.aggregate({ where, _sum: { tokensUsed: true } }),
    ]);
    return (tools._sum.tokensUsed ?? 0) + (agents._sum.tokensUsed ?? 0);
  });
}

export async function loadRequestDailyTrend(
  days: ControlCenterAiUsageRange,
  query: ControlCenterAiUsageQuery,
) {
  return buildDailyTrend(days, async (dayStart, dayEnd) => {
    const where = {
      createdAt: { gte: dayStart, lt: dayEnd },
      ...(query.businessId ? { businessId: query.businessId } : {}),
    };
    const [tools, agents] = await Promise.all([
      prisma.aiToolExecution.count({ where }),
      prisma.aiAgentExecution.count({ where }),
    ]);
    return tools + agents;
  });
}

export async function loadCostDailyTrend(
  days: ControlCenterAiUsageRange,
  query: ControlCenterAiUsageQuery,
) {
  return buildDailyTrend(days, async (dayStart, dayEnd) => {
    const where = {
      createdAt: { gte: dayStart, lt: dayEnd },
      ...(query.businessId ? { businessId: query.businessId } : {}),
    };
    const [tools, agents] = await Promise.all([
      prisma.aiToolExecution.aggregate({ where, _sum: { tokensUsed: true } }),
      prisma.aiAgentExecution.aggregate({ where, _sum: { costCents: true } }),
    ]);
    return (
      Math.round((tools._sum.tokensUsed ?? 0) * AI_TOKEN_COST_PENCE_ESTIMATE) +
      (agents._sum.costCents ?? 0)
    );
  });
}

export async function loadTokenMonthlyTrend(query: ControlCenterAiUsageQuery) {
  return buildMonthlyTrend(6, async (monthStart, monthEnd) => {
    const where = {
      createdAt: { gte: monthStart, lt: monthEnd },
      ...(query.businessId ? { businessId: query.businessId } : {}),
    };
    const [tools, agents] = await Promise.all([
      prisma.aiToolExecution.aggregate({ where, _sum: { tokensUsed: true } }),
      prisma.aiAgentExecution.aggregate({ where, _sum: { tokensUsed: true } }),
    ]);
    return (tools._sum.tokensUsed ?? 0) + (agents._sum.tokensUsed ?? 0);
  });
}

export async function loadRecentExecutions(
  window: AiUsageDateWindow,
  query: ControlCenterAiUsageQuery,
  limit = 20,
) {
  return prisma.aiToolExecution.findMany({
    where: buildExecutionWhere(window, query),
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      business: { select: { businessName: true } },
      tool: { select: { name: true, module: true } },
    },
  });
}
