"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { AI_HR_AGENT_ROUTES } from "@/modules/ai-hr-agent-management/constants/routes";
import { requireAiHrAgentActionContext } from "@/modules/ai-hr-agent-management/lib/get-ai-hr-agent-context";
import { runHrAnalysis } from "@/services/ai-hr-analysis.service";
import { dismissHrInsight, updateHrRecommendationStatus } from "@/services/ai-hr-insight.service";

function revalidateHrPages(): void {
  for (const route of Object.values(AI_HR_AGENT_ROUTES)) {
    revalidatePath(route());
  }
}

export async function runHrAnalysisAction() {
  const context = await requireAiHrAgentActionContext(PERMISSION_CODES.AI_HR_EXECUTE);
  const result = await runHrAnalysis(context.user.id);
  revalidateHrPages();
  return result;
}

export async function updateHrRecommendationStatusAction(recommendationId: string, status: string) {
  const context = await requireAiHrAgentActionContext(PERMISSION_CODES.AI_HR_MANAGE);
  const recommendation = await updateHrRecommendationStatus(
    context.user.id,
    recommendationId,
    status,
  );
  revalidateHrPages();
  return recommendation;
}

export async function dismissHrInsightAction(insightId: string) {
  const context = await requireAiHrAgentActionContext(PERMISSION_CODES.AI_HR_MANAGE);
  const insight = await dismissHrInsight(context.user.id, insightId);
  revalidateHrPages();
  return insight;
}
