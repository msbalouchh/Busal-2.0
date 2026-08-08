import "server-only";

import type {
  CrmPlatformContext,
  CustomerAiContext,
  CustomerRecord,
} from "@/modules/crm/types/customer";
import { getCustomerSummary } from "@/modules/crm/utils/customer-selectors";
import { customerService } from "@/modules/crm/services/customer.service";
import {
  resolveBusinessContextFromModule,
  runModuleAiJsonTask,
  type ModulePlatformContext,
} from "@/services/ai-engine-bridge.service";

const MODULE_NAME = "crm";

function toModulePlatform(context: CrmPlatformContext): ModulePlatformContext {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

async function runCrmAiInference<T>(
  context: CrmPlatformContext,
  task: string,
  data: Record<string, unknown>,
  instructions?: string,
): Promise<T | null> {
  const platform = await resolveBusinessContextFromModule(toModulePlatform(context));
  return runModuleAiJsonTask<T>(platform, {
    module: MODULE_NAME,
    task,
    context: data,
    instructions,
  });
}

export interface CustomerAiInsights {
  summary: string;
  insights: string[];
  lifetimeValuePence: number;
  churnRiskScore: number;
  upsellSuggestions: string[];
  segmentationSuggestions: string[];
  communicationSuggestions: string[];
  recommendedActions: string[];
  sentiment: CustomerAiContext["sentiment"];
}

function buildInsights(record: CustomerRecord): string[] {
  const insights: string[] = [
    `Lifetime value: £${(record.analytics.lifetimeValuePence / 100).toFixed(2)}`,
    `Churn risk: ${(record.analytics.churnRiskScore * 100).toFixed(0)}%`,
    `${record.analytics.visitCount} total visits`,
  ];

  if (record.analytics.lastOrderAt) {
    insights.push(
      `Last order: ${new Date(record.analytics.lastOrderAt).toLocaleDateString("en-GB")}`,
    );
  }

  if (record.segments.length > 0) {
    insights.push(`Segments: ${record.segments.map((segment) => segment.name).join(", ")}`);
  }

  return insights;
}

export async function generateCustomerAiInsights(
  customerId: string,
  context: CrmPlatformContext,
): Promise<CustomerAiInsights | null> {
  const record = await customerService.getById(customerId, context);

  if (!record) {
    return null;
  }

  const dataContext = {
    customerId,
    displayName: record.profile.displayName,
    analytics: record.analytics,
    loyalty: record.loyalty,
    preferences: record.preferences,
    segments: record.segments.map((segment) => segment.name),
    recentOrders: record.timeline.slice(0, 5),
  };

  const aiResult = await runCrmAiInference<CustomerAiInsights>(
    context,
    "generateCustomerAiInsights",
    dataContext,
    "Generate customer AI insights. Return JSON with summary, insights, lifetimeValuePence, churnRiskScore, upsellSuggestions, segmentationSuggestions, communicationSuggestions, recommendedActions, and sentiment (positive|neutral|negative).",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    summary: getCustomerSummary(record),
    insights: buildInsights(record),
    lifetimeValuePence: record.analytics.lifetimeValuePence,
    churnRiskScore: record.analytics.churnRiskScore,
    upsellSuggestions: [],
    segmentationSuggestions: record.segments.map((segment) => segment.name),
    communicationSuggestions: [`Preferred channel: ${record.preferences.preferredContactChannel}`],
    recommendedActions: [],
    sentiment: "neutral",
  };
}

export async function buildCustomerAiContext(
  customerId: string,
  context: CrmPlatformContext,
): Promise<CustomerAiContext | null> {
  const insights = await generateCustomerAiInsights(customerId, context);

  if (!insights) {
    return null;
  }

  return {
    customerId,
    summary: insights.summary,
    insights: insights.insights,
    recommendedActions: insights.recommendedActions,
    sentiment: insights.sentiment,
    lastGeneratedAt: new Date().toISOString(),
  };
}

export async function generateMarketingRecommendations(
  customerId: string,
  context: CrmPlatformContext,
): Promise<string[]> {
  const record = await customerService.getById(customerId, context);

  if (!record) {
    return [];
  }

  const dataContext = {
    customerId,
    displayName: record.profile.displayName,
    analytics: record.analytics,
    loyalty: record.loyalty,
    preferences: record.preferences,
    segments: record.segments.map((segment) => segment.name),
  };

  const aiResult = await runCrmAiInference<{ recommendations?: string[] }>(
    context,
    "generateMarketingRecommendations",
    dataContext,
    "Generate marketing recommendations. Return JSON with recommendations string array.",
  );

  if (aiResult?.recommendations?.length) {
    return aiResult.recommendations;
  }

  return [];
}

export async function buildCustomerHistorySummary(
  customerId: string,
  context: CrmPlatformContext,
): Promise<Record<string, unknown> | null> {
  const record = await customerService.getById(customerId, context);

  if (!record) {
    return null;
  }

  return {
    customerId,
    displayName: record.profile.displayName,
    timeline: record.timeline.slice(0, 10),
    communications: record.communications.slice(0, 5),
    notes: record.notes,
    analytics: record.analytics,
  };
}

export async function searchCustomersForAi(
  query: string,
  context: CrmPlatformContext,
): Promise<CustomerRecord[]> {
  const result = await customerService.search({ query, limit: 10, pageSize: 10 }, context);

  return [...result.records].sort(
    (left, right) => right.analytics.lifetimeValuePence - left.analytics.lifetimeValuePence,
  );
}
