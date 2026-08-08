import "server-only";

import { generateRevenueForecast } from "@/services/revops.service";
import { createFinanceInsight } from "@/services/ai-finance-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface ForecastPoint {
  month: string;
  projectedRevenuePence: number;
  source: string;
}

export interface FinancialForecastFramework {
  horizonMonths: number;
  points: ForecastPoint[];
  methodology: string;
  disclaimer: string;
}

export async function getFinancialForecastFramework(
  ownerId: string,
): Promise<FinancialForecastFramework> {
  const businessId = await getOwnedBusinessId(ownerId);
  const forecast = await generateRevenueForecast(businessId);

  return {
    horizonMonths: forecast.length,
    points: forecast.map((f) => ({
      month: f.month,
      projectedRevenuePence: f.totalProjectedPence,
      source:
        f.pipelinePence >= f.activeContractsPence && f.pipelinePence >= f.renewalsPence
          ? "SALES_PIPELINE"
          : f.renewalsPence >= f.activeContractsPence
            ? "RENEWALS"
            : "ACTIVE_CONTRACTS",
    })),
    methodology: "Combines active contracts, upcoming renewals, and weighted sales pipeline.",
    disclaimer: "Forecasts are indicative only. Connect accounting data for higher accuracy.",
  };
}

export async function generateForecastInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "finance",
    task: "forecast-insights",
    loadContext: getFinancialForecastFramework,
    persistInsight: (businessId, insight) =>
      createFinanceInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "forecast",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}
