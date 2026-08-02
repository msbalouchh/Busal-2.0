"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { AI_FINANCE_AGENT_ROUTES } from "@/modules/ai-finance-agent-management/constants/routes";
import { requireAiFinanceAgentActionContext } from "@/modules/ai-finance-agent-management/lib/get-ai-finance-agent-context";
import { runFinanceAnalysis } from "@/services/ai-finance-analysis.service";
import {
  dismissFinanceInsight,
  updateFinanceRecommendationStatus,
} from "@/services/ai-finance-recommendation.service";

function revalidateFinancePages(): void {
  for (const route of Object.values(AI_FINANCE_AGENT_ROUTES)) {
    revalidatePath(route());
  }
}

export async function runFinanceAnalysisAction() {
  const context = await requireAiFinanceAgentActionContext(PERMISSION_CODES.AI_FINANCE_EXECUTE);
  const result = await runFinanceAnalysis(context.user.id);
  revalidateFinancePages();
  return result;
}

export async function updateFinanceRecommendationStatusAction(
  recommendationId: string,
  status: string,
) {
  const context = await requireAiFinanceAgentActionContext(PERMISSION_CODES.AI_FINANCE_MANAGE);
  const recommendation = await updateFinanceRecommendationStatus(
    context.user.id,
    recommendationId,
    status,
  );
  revalidateFinancePages();
  return recommendation;
}

export async function dismissFinanceInsightAction(insightId: string) {
  const context = await requireAiFinanceAgentActionContext(PERMISSION_CODES.AI_FINANCE_MANAGE);
  const insight = await dismissFinanceInsight(context.user.id, insightId);
  revalidateFinancePages();
  return insight;
}
