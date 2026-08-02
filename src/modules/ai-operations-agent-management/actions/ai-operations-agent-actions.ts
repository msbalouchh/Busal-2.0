"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { AI_OPERATIONS_AGENT_ROUTES } from "@/modules/ai-operations-agent-management/constants/routes";
import { requireAiOperationsAgentActionContext } from "@/modules/ai-operations-agent-management/lib/get-ai-operations-agent-context";
import { runOperationsAnalysis } from "@/services/ai-operations-analysis.service";
import {
  dismissOperationInsight,
  updateOperationRecommendationStatus,
} from "@/services/ai-operations-efficiency-recommendation.service";

function revalidateOperationsPages(): void {
  for (const route of Object.values(AI_OPERATIONS_AGENT_ROUTES)) {
    revalidatePath(route());
  }
}

export async function runOperationsAnalysisAction() {
  const context = await requireAiOperationsAgentActionContext(
    PERMISSION_CODES.AI_OPERATIONS_EXECUTE,
  );
  const result = await runOperationsAnalysis(context.user.id);
  revalidateOperationsPages();
  return result;
}

export async function updateOperationRecommendationStatusAction(
  recommendationId: string,
  status: string,
) {
  const context = await requireAiOperationsAgentActionContext(
    PERMISSION_CODES.AI_OPERATIONS_MANAGE,
  );
  const recommendation = await updateOperationRecommendationStatus(
    context.user.id,
    recommendationId,
    status,
  );
  revalidateOperationsPages();
  return recommendation;
}

export async function dismissOperationInsightAction(insightId: string) {
  const context = await requireAiOperationsAgentActionContext(
    PERMISSION_CODES.AI_OPERATIONS_MANAGE,
  );
  const insight = await dismissOperationInsight(context.user.id, insightId);
  revalidateOperationsPages();
  return insight;
}
