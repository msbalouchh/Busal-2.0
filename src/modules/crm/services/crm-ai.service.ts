import "server-only";

import type {
  CrmPlatformContext,
  CustomerAiContext,
  CustomerRecord,
} from "@/modules/crm/types/customer";
import { getCustomerSummary } from "@/modules/crm/utils/customer-selectors";
import { customerService } from "@/modules/crm/services/customer.service";

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

function buildUpsellSuggestions(record: CustomerRecord): string[] {
  const suggestions: string[] = [];

  if (record.analytics.averageOrderValuePence < 3000) {
    suggestions.push("Offer premium menu pairing to increase average order value.");
  }

  if (record.loyalty.pointsBalance > 500) {
    suggestions.push("Promote reward redemption on next visit.");
  }

  if (record.analytics.visitCount >= 5) {
    suggestions.push("Introduce subscription or membership upgrade.");
  }

  if (suggestions.length === 0) {
    suggestions.push("Recommend chef's tasting menu for next visit.");
  }

  return suggestions;
}

function buildSegmentationSuggestions(record: CustomerRecord): string[] {
  const suggestions: string[] = [];

  if (record.analytics.lifetimeValuePence > 500000) {
    suggestions.push("Assign to VIP segment with exclusive offers.");
  }

  if (record.analytics.churnRiskScore > 0.5) {
    suggestions.push("Move to at-risk win-back segment.");
  }

  if (record.analytics.visitCount >= 10) {
    suggestions.push("Include in loyal regulars segment.");
  }

  if (record.preferences.marketingOptIn) {
    suggestions.push("Eligible for marketing automation cohorts.");
  }

  return suggestions;
}

function buildCommunicationSuggestions(record: CustomerRecord): string[] {
  const channel = record.preferences.preferredContactChannel;
  const suggestions: string[] = [`Preferred channel: ${channel}.`];

  if (record.analytics.churnRiskScore > 0.4) {
    suggestions.push("Send personalized win-back message within 48 hours.");
  }

  if (record.loyalty.pointsBalance > 1000) {
    suggestions.push("Notify customer about available loyalty rewards.");
  }

  if (record.analytics.lastOrderAt) {
    suggestions.push("Follow up with thank-you message after recent order.");
  }

  return suggestions;
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

function buildRecommendedActions(record: CustomerRecord): string[] {
  const actions: string[] = [];

  if (record.analytics.churnRiskScore > 0.4) {
    actions.push("Send win-back offer with 15% discount.");
  }

  if (record.loyalty.pointsBalance > 1000) {
    actions.push("Promote rewards redemption before points expire.");
  }

  if (record.preferences.marketingOptIn) {
    actions.push("Include in next email campaign segment.");
  }

  if (actions.length === 0) {
    actions.push("Maintain current engagement cadence.");
  }

  return actions;
}

export async function generateCustomerAiInsights(
  customerId: string,
  context: CrmPlatformContext,
): Promise<CustomerAiInsights | null> {
  const record = await customerService.getById(customerId, context);

  if (!record) {
    return null;
  }

  const sentiment: CustomerAiContext["sentiment"] =
    record.analytics.churnRiskScore > 0.5
      ? "negative"
      : record.analytics.lifetimeValuePence > 100000
        ? "positive"
        : "neutral";

  return {
    summary: getCustomerSummary(record),
    insights: buildInsights(record),
    lifetimeValuePence: record.analytics.lifetimeValuePence,
    churnRiskScore: record.analytics.churnRiskScore,
    upsellSuggestions: buildUpsellSuggestions(record),
    segmentationSuggestions: buildSegmentationSuggestions(record),
    communicationSuggestions: buildCommunicationSuggestions(record),
    recommendedActions: buildRecommendedActions(record),
    sentiment,
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
  const insights = await generateCustomerAiInsights(customerId, context);
  return insights?.recommendedActions ?? [];
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
