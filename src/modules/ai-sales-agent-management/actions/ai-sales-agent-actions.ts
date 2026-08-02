"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { AI_SALES_AGENT_ROUTES } from "@/modules/ai-sales-agent-management/constants/routes";
import { requireAiSalesAgentActionContext } from "@/modules/ai-sales-agent-management/lib/get-ai-sales-agent-context";
import { runSalesAnalysis } from "@/services/ai-sales-analysis.service";
import {
  dismissInsight,
  updateRecommendationStatus,
} from "@/services/ai-sales-recommendation.service";
import { generateSalesForecast } from "@/services/ai-sales-forecast.service";
import type { SalesForecastHorizon } from "@/modules/ai-sales-agent-management/types/ai-sales-agent-types";

function revalidateSalesPages(): void {
  revalidatePath(AI_SALES_AGENT_ROUTES.dashboard());
  revalidatePath(AI_SALES_AGENT_ROUTES.insights());
  revalidatePath(AI_SALES_AGENT_ROUTES.recommendations());
  revalidatePath(AI_SALES_AGENT_ROUTES.opportunities());
  revalidatePath(AI_SALES_AGENT_ROUTES.revenue());
  revalidatePath(AI_SALES_AGENT_ROUTES.search());
}

export async function runSalesAnalysisAction() {
  const context = await requireAiSalesAgentActionContext(PERMISSION_CODES.AI_SALES_EXECUTE);
  const result = await runSalesAnalysis(context.user.id);
  revalidateSalesPages();
  return result;
}

export async function updateSalesRecommendationStatusAction(
  recommendationId: string,
  status: string,
) {
  const context = await requireAiSalesAgentActionContext(PERMISSION_CODES.AI_SALES_MANAGE);
  const recommendation = await updateRecommendationStatus(
    context.user.id,
    recommendationId,
    status,
  );
  revalidateSalesPages();
  return recommendation;
}

export async function dismissSalesInsightAction(insightId: string) {
  const context = await requireAiSalesAgentActionContext(PERMISSION_CODES.AI_SALES_MANAGE);
  const insight = await dismissInsight(context.user.id, insightId);
  revalidateSalesPages();
  return insight;
}

export async function generateSalesForecastAction(horizon: SalesForecastHorizon = "month") {
  const context = await requireAiSalesAgentActionContext(PERMISSION_CODES.AI_SALES_EXECUTE);
  return generateSalesForecast(context.user.id, { horizon });
}
