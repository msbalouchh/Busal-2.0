"use server";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import type {
  AddInternalNoteInput,
  AiInsightRequest,
  AssignConversationInput,
  CreateConversationInput,
  SearchConversationsInput,
  SendMessageInput,
} from "@/modules/communication/types/communication-types";
import {
  addInternalNote,
  assignConversation,
  closeConversation,
  createConversation,
  runAiInsight,
  sendConversationReply,
} from "@/services/communication.service";

export async function createConversationAction(input: CreateConversationInput) {
  return protectedAction(PERMISSION_CODES.COMMUNICATION_MANAGE, async ({ platform }) =>
    createConversation(platform, input),
  );
}

export async function sendConversationReplyAction(input: SendMessageInput) {
  return protectedAction(PERMISSION_CODES.COMMUNICATION_REPLY, async ({ platform }) =>
    sendConversationReply(platform, input),
  );
}

export async function addInternalNoteAction(input: AddInternalNoteInput) {
  return protectedAction(PERMISSION_CODES.COMMUNICATION_REPLY, async ({ platform }) =>
    addInternalNote(platform, input),
  );
}

export async function assignConversationAction(input: AssignConversationInput) {
  return protectedAction(PERMISSION_CODES.COMMUNICATION_ASSIGN, async ({ platform }) => {
    await assignConversation(platform, input);
    return { success: true };
  });
}

export async function closeConversationAction(conversationId: string) {
  return protectedAction(PERMISSION_CODES.COMMUNICATION_MANAGE, async ({ platform }) => {
    await closeConversation(platform, conversationId);
    return { success: true };
  });
}

export async function runAiInsightAction(input: AiInsightRequest) {
  return protectedAction(PERMISSION_CODES.COMMUNICATION_VIEW, async ({ platform }) =>
    runAiInsight(platform, input),
  );
}

export async function searchConversationsAction(input: SearchConversationsInput) {
  return protectedAction(PERMISSION_CODES.COMMUNICATION_VIEW, async ({ platform }) => {
    const { searchConversations } = await import("@/services/communication.service");
    return searchConversations(platform, input);
  });
}
