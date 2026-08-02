import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import type {
  VoiceCommandListQuery,
  VoiceSessionListQuery,
} from "@/modules/ai-voice-agent-management/types/ai-voice-agent-types";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getVoiceAgentSummary,
  getVoiceAnalyticsSnapshot,
} from "@/services/ai-voice-analytics.service";
import { listVoiceCommands, getVoiceCommandsForSession } from "@/services/ai-voice-command.service";
import { listVoiceIntents } from "@/services/ai-voice-intent-routing.service";
import { listVoiceSessions, getVoiceSessionById } from "@/services/ai-voice-session.service";
import { getVoiceSettings, getVoiceSessionContext } from "@/services/ai-voice-context.service";
import { resolveVoiceAgentPermissions } from "@/services/ai-voice-agent-permission.service";
import { getVoiceProviderManager } from "@/services/voice-provider-manager.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface AiVoiceAgentContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ReturnType<typeof resolveVoiceAgentPermissions>;
}

async function resolveVoiceAgentBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getAiVoiceAgentContext = cache(async (): Promise<AiVoiceAgentContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveVoiceAgentBusiness(user);
  const permissionsFlags = resolveVoiceAgentPermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );

  if (!permissionsFlags.canView) redirect(ROUTES.application);

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
  };
});

export async function requireAiVoiceAgentActionContext(
  permission: string,
): Promise<AiVoiceAgentContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveVoiceAgentBusiness(user);
  const permissionsFlags = resolveVoiceAgentPermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );

  const allowed = loaded.authorization.isOwner || loaded.authorization.permissions.has(permission);
  if (!allowed) throw permissionDenied();

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
  };
}

export const getVoiceAgentDashboardContext = cache(async () => {
  const context = await getAiVoiceAgentContext();
  const summary = await getVoiceAgentSummary(context.user.id);
  return { ...context, ...summary };
});

export const getVoiceSessionsContext = cache(async (query: VoiceSessionListQuery = {}) => {
  const context = await getAiVoiceAgentContext();
  const sessions = await listVoiceSessions(context.user.id, query);
  return { ...context, sessions };
});

export const getVoiceSessionDetailContext = cache(async (sessionId: string) => {
  const context = await getAiVoiceAgentContext();
  const [session, commands, sessionContext] = await Promise.all([
    getVoiceSessionById(context.user.id, sessionId),
    getVoiceCommandsForSession(context.user.id, sessionId),
    getVoiceSessionContext(context.user.id, sessionId),
  ]);
  return { ...context, session, commands, sessionContext };
});

export const getVoiceCommandsContext = cache(async (query: VoiceCommandListQuery = {}) => {
  const context = await getAiVoiceAgentContext();
  const commands = await listVoiceCommands(context.user.id, query);
  const intents = listVoiceIntents();
  return { ...context, commands, intents };
});

export const getVoiceAnalyticsContext = cache(async () => {
  const context = await getAiVoiceAgentContext();
  const analytics = await getVoiceAnalyticsSnapshot(context.user.id);
  const intents = listVoiceIntents();
  return { ...context, analytics, intents };
});

export const getVoiceSettingsContext = cache(async () => {
  const context = await getAiVoiceAgentContext();
  const settings = await getVoiceSettings(context.user.id);
  const providerManager = getVoiceProviderManager();
  return {
    ...context,
    settings,
    sttProvider: providerManager.getSttProvider(),
    ttsProvider: providerManager.getTtsProvider(),
    registeredProviders: providerManager.listProviders(),
  };
});

export const getVoiceSearchContext = cache(async (search = "") => {
  const context = await getAiVoiceAgentContext();
  const trimmed = search.trim();
  const [sessions, commands] = trimmed
    ? await Promise.all([
        listVoiceSessions(context.user.id, { search: trimmed, pageSize: 10 }),
        listVoiceCommands(context.user.id, { search: trimmed, pageSize: 10 }),
      ])
    : [
        { items: [], total: 0, page: 1, pageSize: 10 },
        { items: [], total: 0, page: 1, pageSize: 10 },
      ];

  return {
    ...context,
    search: trimmed,
    results: { sessions: sessions.items, commands: commands.items },
  };
});
