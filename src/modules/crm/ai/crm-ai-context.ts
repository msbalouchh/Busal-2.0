import { customerService } from "@/modules/crm/services/customer.service";
import { getCustomerSummary, sortByLifetimeValue } from "@/modules/crm/utils/customer-selectors";
import type { CustomerAiContext, CustomerRecord } from "@/modules/crm/types/customer";

export function buildCustomerAiContext(customerId: string): CustomerAiContext | null {
  const record = customerService.getById(customerId);

  if (!record) {
    return null;
  }

  return {
    ...record.aiContext,
    summary: getCustomerSummary(record),
    insights: [
      ...record.aiContext.insights,
      `Churn risk score: ${(record.analytics.churnRiskScore * 100).toFixed(0)}%`,
      `Preferred channel: ${record.preferences.preferredContactChannel}`,
    ],
    recommendedActions: record.aiContext.recommendedActions,
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function generateMarketingRecommendations(customerId: string): string[] {
  const record = customerService.getById(customerId);

  if (!record) {
    return [];
  }

  const recommendations: string[] = [];

  if (record.analytics.churnRiskScore > 0.4) {
    recommendations.push("Send win-back offer with 15% discount.");
  }

  if (record.loyalty.pointsBalance > 1000) {
    recommendations.push("Promote rewards redemption before points expire.");
  }

  if (record.preferences.marketingOptIn) {
    recommendations.push("Include in next email campaign segment.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Maintain current engagement cadence.");
  }

  return recommendations;
}

export function buildCustomerHistorySummary(customerId: string): Record<string, unknown> | null {
  const record = customerService.getById(customerId);

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

export function searchCustomersForAi(query: string): CustomerRecord[] {
  return sortByLifetimeValue(customerService.search({ query, limit: 10 }));
}
