"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { AI_RESTAURANT_ASSISTANT_ROUTES } from "@/modules/ai-restaurant-assistant-management/constants/routes";
import { requireAiRestaurantAssistantActionContext } from "@/modules/ai-restaurant-assistant-management/lib/get-ai-restaurant-assistant-context";
import {
  validateRecommendationUpdate,
  validateSendMessageInput,
} from "@/modules/ai-restaurant-assistant-management/lib/ai-restaurant-assistant-validation";
import type {
  SendMessageInput,
  UpdateRecommendationInput,
} from "@/modules/ai-restaurant-assistant-management/types/ai-restaurant-assistant-types";
import {
  archiveConversation,
  pinConversation,
  sendAssistantMessage,
  updateRecommendationStatus,
} from "@/services/ai-restaurant-assistant.service";

function revalidateAssistantPages(conversationId?: string) {
  revalidatePath(AI_RESTAURANT_ASSISTANT_ROUTES.dashboard());
  revalidatePath(AI_RESTAURANT_ASSISTANT_ROUTES.chat());
  revalidatePath(AI_RESTAURANT_ASSISTANT_ROUTES.recommendations());
  revalidatePath(AI_RESTAURANT_ASSISTANT_ROUTES.insights());
  if (conversationId) {
    revalidatePath(AI_RESTAURANT_ASSISTANT_ROUTES.chat(conversationId));
  }
}

export async function sendAssistantMessageAction(input: SendMessageInput) {
  const context = await requireAiRestaurantAssistantActionContext(PERMISSION_CODES.AI_CHAT);
  validateSendMessageInput(input);
  const response = await sendAssistantMessage(context.user.id, input);
  revalidateAssistantPages(response.conversationId);
  return response;
}

export async function archiveConversationAction(conversationId: string) {
  const context = await requireAiRestaurantAssistantActionContext(PERMISSION_CODES.AI_CHAT);
  await archiveConversation(context.user.id, conversationId);
  revalidateAssistantPages(conversationId);
  return { success: true };
}

export async function pinConversationAction(conversationId: string, isPinned: boolean) {
  const context = await requireAiRestaurantAssistantActionContext(PERMISSION_CODES.AI_CHAT);
  const conversation = await pinConversation(context.user.id, conversationId, isPinned);
  revalidateAssistantPages(conversationId);
  return conversation;
}

export async function updateRecommendationAction(
  recommendationId: string,
  input: UpdateRecommendationInput,
) {
  const context = await requireAiRestaurantAssistantActionContext(
    PERMISSION_CODES.AI_RECOMMENDATION_MANAGE,
  );
  validateRecommendationUpdate(input);
  const recommendation = await updateRecommendationStatus(
    context.user.id,
    recommendationId,
    input.status,
  );
  revalidateAssistantPages();
  return recommendation;
}
