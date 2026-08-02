"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { AI_VOICE_AGENT_ROUTES } from "@/modules/ai-voice-agent-management/constants/routes";
import { requireAiVoiceAgentActionContext } from "@/modules/ai-voice-agent-management/lib/get-ai-voice-agent-context";
import { processVoiceCommand } from "@/services/ai-voice-command.service";
import { startVoiceSession, updateVoiceSessionStatus } from "@/services/ai-voice-session.service";
import { updateVoiceSettings } from "@/services/ai-voice-context.service";
import type { VoiceSettings } from "@/modules/ai-voice-agent-management/types/ai-voice-agent-types";
import type { VoiceSessionStatus } from "@prisma/client";

function revalidateVoicePages(sessionId?: string): void {
  revalidatePath(AI_VOICE_AGENT_ROUTES.dashboard());
  revalidatePath(AI_VOICE_AGENT_ROUTES.sessions());
  revalidatePath(AI_VOICE_AGENT_ROUTES.commands());
  revalidatePath(AI_VOICE_AGENT_ROUTES.analytics());
  revalidatePath(AI_VOICE_AGENT_ROUTES.settings());
  revalidatePath(AI_VOICE_AGENT_ROUTES.search());
  if (sessionId) {
    revalidatePath(AI_VOICE_AGENT_ROUTES.sessionDetail(sessionId));
  }
}

export async function startVoiceSessionAction(input?: {
  language?: string;
  customerId?: string;
  conversationId?: string;
}) {
  const context = await requireAiVoiceAgentActionContext(PERMISSION_CODES.AI_VOICE_EXECUTE);
  const session = await startVoiceSession(context.user.id, input);
  revalidateVoicePages(session.id);
  return session;
}

export async function updateVoiceSessionStatusAction(
  sessionId: string,
  status: VoiceSessionStatus,
) {
  const context = await requireAiVoiceAgentActionContext(PERMISSION_CODES.AI_VOICE_MANAGE);
  const session = await updateVoiceSessionStatus(context.user.id, sessionId, status);
  revalidateVoicePages(sessionId);
  return session;
}

export async function processVoiceCommandAction(sessionId: string, command: string) {
  const context = await requireAiVoiceAgentActionContext(PERMISSION_CODES.AI_VOICE_EXECUTE);
  const result = await processVoiceCommand(context.user.id, sessionId, command);
  revalidateVoicePages(sessionId);
  return result;
}

export async function updateVoiceSettingsAction(settings: Partial<VoiceSettings>) {
  const context = await requireAiVoiceAgentActionContext(PERMISSION_CODES.AI_VOICE_MANAGE);
  const updated = await updateVoiceSettings(context.user.id, settings);
  revalidateVoicePages();
  return updated;
}
