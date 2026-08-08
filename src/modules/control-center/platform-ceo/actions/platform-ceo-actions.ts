"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { PLATFORM_CEO_ROUTES } from "@/modules/control-center/platform-ceo/constants/platform-ceo";
import type {
  PlatformCeoChatRequest,
  PlatformCeoConversationQuery,
} from "@/modules/control-center/platform-ceo/types/platform-ceo.types";
import {
  archivePlatformCeoConversationForOperator,
  createPlatformCeoConversationForOperator,
  deletePlatformCeoConversationForOperator,
  getPlatformCeoHubBundle,
  renamePlatformCeoConversationForOperator,
  searchPlatformCeoConversationsForOperator,
  sendPlatformCeoMessage,
} from "@/services/control-center-platform-ceo.service";

function revalidateCeoPage() {
  revalidatePath(PLATFORM_CEO_ROUTES.hub);
}

export async function refreshPlatformCeoAction(conversationId?: string | null) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_CEO, async ({ operator }) =>
    getPlatformCeoHubBundle(operator, { conversationId }),
  );
}

export async function createPlatformCeoConversationAction(title?: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_CEO, async ({ operator }) => {
    const conversation = await createPlatformCeoConversationForOperator(operator, title);
    revalidateCeoPage();
    return conversation;
  });
}

export async function sendPlatformCeoMessageAction(request: PlatformCeoChatRequest) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_CEO, async ({ operator }) => {
    const response = await sendPlatformCeoMessage(operator, request);
    revalidateCeoPage();
    return response;
  });
}

export async function renamePlatformCeoConversationAction(conversationId: string, title: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_CEO, async ({ operator }) => {
    const conversation = await renamePlatformCeoConversationForOperator(
      operator,
      conversationId,
      title,
    );
    revalidateCeoPage();
    return conversation;
  });
}

export async function archivePlatformCeoConversationAction(conversationId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_CEO, async ({ operator }) => {
    const conversation = await archivePlatformCeoConversationForOperator(operator, conversationId);
    revalidateCeoPage();
    return conversation;
  });
}

export async function deletePlatformCeoConversationAction(conversationId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_CEO, async ({ operator }) => {
    await deletePlatformCeoConversationForOperator(operator, conversationId);
    revalidateCeoPage();
    return { success: true };
  });
}

export async function searchPlatformCeoConversationsAction(query: PlatformCeoConversationQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_CEO, async ({ operator }) =>
    searchPlatformCeoConversationsForOperator(operator, query),
  );
}
