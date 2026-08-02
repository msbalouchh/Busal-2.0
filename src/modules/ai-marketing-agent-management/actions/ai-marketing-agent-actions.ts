"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { AI_MARKETING_AGENT_ROUTES } from "@/modules/ai-marketing-agent-management/constants/routes";
import { requireAiMarketingAgentActionContext } from "@/modules/ai-marketing-agent-management/lib/get-ai-marketing-agent-context";
import { runMarketingAnalysis } from "@/services/ai-marketing-analysis.service";
import { dismissMarketingInsight } from "@/services/ai-marketing-recommendation.service";

function revalidateMarketingPages(): void {
  revalidatePath(AI_MARKETING_AGENT_ROUTES.dashboard());
  revalidatePath(AI_MARKETING_AGENT_ROUTES.insights());
  revalidatePath(AI_MARKETING_AGENT_ROUTES.audience());
  revalidatePath(AI_MARKETING_AGENT_ROUTES.segments());
  revalidatePath(AI_MARKETING_AGENT_ROUTES.recommendations());
  revalidatePath(AI_MARKETING_AGENT_ROUTES.performance());
  revalidatePath(AI_MARKETING_AGENT_ROUTES.timeline());
  revalidatePath(AI_MARKETING_AGENT_ROUTES.search());
}

export async function runMarketingAnalysisAction() {
  const context = await requireAiMarketingAgentActionContext(PERMISSION_CODES.AI_MARKETING_EXECUTE);
  const result = await runMarketingAnalysis(context.user.id);
  revalidateMarketingPages();
  return result;
}

export async function dismissMarketingInsightAction(insightId: string) {
  const context = await requireAiMarketingAgentActionContext(PERMISSION_CODES.AI_MARKETING_MANAGE);
  const insight = await dismissMarketingInsight(context.user.id, insightId);
  revalidateMarketingPages();
  return insight;
}
