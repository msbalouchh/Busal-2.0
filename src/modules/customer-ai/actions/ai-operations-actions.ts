"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { CUSTOMER_AI_ROUTES, CUSTOMER_AI_CHANNELS } from "@/modules/customer-ai/constants/customer-ai.constants";
import {
  getOwnerOperationsOverview,
  runOwnerAiOperationsChat,
} from "@/modules/customer-ai/services/owner-ai-operations.service";
import { listAiBusinessActions } from "@/modules/customer-ai/tools/tool-audit.service";
import {
  getAiOperationsCapabilities,
  updateAiOperationsCapabilities,
} from "@/modules/customer-ai/tools/tool-permission-service";
import {
  listExpiredConfirmations,
  listPendingConfirmations,
} from "@/modules/customer-ai/tools/confirmation-expiration.service";
import { businessOperationTools } from "@/modules/customer-ai/tools/tool-registry";
import type { AiOperationsCapabilities } from "@/modules/customer-ai/types/customer-ai.types";

export async function getAiOperationsDashboardAction() {
  return protectedAction(PERMISSION_CODES.AI_VIEW, async ({ platform }) => {
    const businessId = platform.business.id;
    const [overview, actions, capabilities, tools, pendingConfirmations, expiredConfirmations] =
      await Promise.all([
      getOwnerOperationsOverview(businessId, platform.user.id),
      listAiBusinessActions(businessId, 30),
      getAiOperationsCapabilities(platform),
      Promise.resolve(
        businessOperationTools.map((tool) => ({
          toolId: tool.toolId,
          name: tool.name,
          riskLevel: tool.riskLevel,
          audience: tool.audience,
          permission: tool.permission,
        })),
      ),
      listPendingConfirmations(businessId),
      listExpiredConfirmations(businessId),
    ]);

    return { overview, actions, capabilities, tools, pendingConfirmations, expiredConfirmations };
  });
}

export async function sendOwnerAiOperationsMessageAction(input: {
  message: string;
  conversationId?: string;
  confirmedActions?: string[];
}) {
  return protectedAction(PERMISSION_CODES.AI_VIEW, async ({ platform }) => {
    const result = await runOwnerAiOperationsChat({
      businessId: platform.business.id,
      ownerId: platform.user.id,
      message: input.message,
      conversationId: input.conversationId,
      confirmedActions: input.confirmedActions,
      channel: CUSTOMER_AI_CHANNELS.WEBSITE,
    });
    revalidatePath(CUSTOMER_AI_ROUTES.operations);
    return result;
  });
}

export async function updateAiOperationsCapabilitiesAction(input: Partial<AiOperationsCapabilities>) {
  return protectedAction(PERMISSION_CODES.SETTINGS_EDIT, async ({ platform }) => {
    const result = await updateAiOperationsCapabilities(platform, input);
    revalidatePath(CUSTOMER_AI_ROUTES.operations);
    revalidatePath(CUSTOMER_AI_ROUTES.controlCenter);
    return result;
  });
}
