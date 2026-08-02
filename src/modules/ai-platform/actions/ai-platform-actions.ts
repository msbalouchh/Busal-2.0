"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { AI_PLATFORM_ROUTES } from "@/modules/ai-platform/constants/ai-platform";
import type { SendAssistantMessageInput } from "@/modules/ai-platform/types/ai-platform-types";
import { setConfigurationValue } from "@/services/settings-engine.service";
import { composeAssistantResponse } from "@/services/ai-platform-module.service";

function revalidateAiPlatformPaths() {
  Object.values(AI_PLATFORM_ROUTES).forEach((path) => {
    if (path.startsWith("/dashboard/ai-platform")) {
      revalidatePath(path);
    }
  });
}

export async function sendAssistantMessageAction(input: SendAssistantMessageInput) {
  return protectedAction(PERMISSION_CODES.AI_KNOWLEDGE_VIEW, async ({ platform }) => {
    const response = await composeAssistantResponse(platform, input.message, {
      collectionIds: input.collectionIds,
    });
    revalidateAiPlatformPaths();
    return { success: true as const, response };
  });
}

export async function updateAiPlatformSettingAction(input: { key: string; value: unknown }) {
  return protectedAction(PERMISSION_CODES.SETTINGS_EDIT, async ({ platform }) => {
    const result = await setConfigurationValue(platform, {
      key: input.key,
      value: input.value,
      scope: "BUSINESS",
      changeReason: "Updated from AI Platform settings",
    });
    revalidateAiPlatformPaths();
    return { success: true as const, result };
  });
}
