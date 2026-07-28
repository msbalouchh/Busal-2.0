"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { AI_TOOLS_ROUTES } from "@/modules/ai-tools/constants/routes";
import { disableAiTool, enableAiTool, executeAiTool } from "@/services/ai-tools.service";

function revalidateAiToolsPaths() {
  Object.values(AI_TOOLS_ROUTES).forEach((path) => {
    revalidatePath(path);
  });
}

export async function executeAiToolAction(input: {
  toolId: string;
  payload?: Record<string, unknown>;
  dryRun?: boolean;
  confirmed?: boolean;
  agentId?: string | null;
  currentModule?: string | null;
  selectedRecord?: { type: string; id: string } | null;
}) {
  return protectedAction(PERMISSION_CODES.AI_TOOL_EXECUTE, async ({ platform }) => {
    const result = await executeAiTool(platform, {
      toolId: input.toolId,
      input: input.payload ?? {},
      dryRun: input.dryRun,
      confirmed: input.confirmed,
      agentId: input.agentId,
      currentModule: input.currentModule,
      selectedRecord: input.selectedRecord,
    });
    revalidateAiToolsPaths();
    return { success: true as const, result };
  });
}

export async function disableAiToolAction(toolId: string) {
  return protectedAction(PERMISSION_CODES.AI_TOOL_DISABLE, async ({ platform }) => {
    await disableAiTool(platform, toolId);
    revalidateAiToolsPaths();
    return { success: true as const };
  });
}

export async function enableAiToolAction(toolId: string) {
  return protectedAction(PERMISSION_CODES.AI_TOOL_ADMIN, async ({ platform }) => {
    await enableAiTool(platform, toolId);
    revalidateAiToolsPaths();
    return { success: true as const };
  });
}
