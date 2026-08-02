"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { AI_SUPPORT_AGENT_ROUTES } from "@/modules/ai-support-agent-management/constants/routes";
import { requireAiSupportAgentActionContext } from "@/modules/ai-support-agent-management/lib/get-ai-support-agent-context";
import { runSupportAnalysis } from "@/services/ai-support-analysis.service";
import {
  dismissSupportInsight,
  updateSupportRecommendationStatus,
} from "@/services/ai-support-response-recommendation.service";

function revalidateSupportPages(): void {
  for (const route of Object.values(AI_SUPPORT_AGENT_ROUTES)) {
    revalidatePath(route());
  }
}

export async function runSupportAnalysisAction() {
  const context = await requireAiSupportAgentActionContext(PERMISSION_CODES.AI_SUPPORT_EXECUTE);
  const result = await runSupportAnalysis(context.user.id);
  revalidateSupportPages();
  return result;
}

export async function updateSupportRecommendationStatusAction(
  recommendationId: string,
  status: string,
) {
  const context = await requireAiSupportAgentActionContext(PERMISSION_CODES.AI_SUPPORT_MANAGE);
  const recommendation = await updateSupportRecommendationStatus(
    context.user.id,
    recommendationId,
    status,
  );
  revalidateSupportPages();
  return recommendation;
}

export async function dismissSupportInsightAction(insightId: string) {
  const context = await requireAiSupportAgentActionContext(PERMISSION_CODES.AI_SUPPORT_MANAGE);
  const insight = await dismissSupportInsight(context.user.id, insightId);
  revalidateSupportPages();
  return insight;
}
