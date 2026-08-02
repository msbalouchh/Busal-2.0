import type { VoiceCommandStatus, VoiceSessionStatus } from "@prisma/client";

import type {
  VoiceCommandListQuery,
  VoiceCommandRecord,
  VoiceSessionListQuery,
  VoiceSessionRecord,
  VoiceSettings,
} from "@/modules/ai-voice-agent-management/types/ai-voice-agent-types";

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  defaultLanguage: "en",
  sttProviderId: null,
  ttsProviderId: null,
  voiceEnabled: true,
  autoRouteIntents: true,
};

export const SUPPORTED_VOICE_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "ur", label: "Urdu" },
] as const;

export function serializeVoiceSession(session: {
  id: string;
  businessId: string;
  staffId: string | null;
  customerId: string | null;
  conversationId: string | null;
  status: VoiceSessionStatus;
  language: string;
  startedAt: Date;
  endedAt: Date | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  staff?: { fullName: string } | null;
  customer?: { name: string } | null;
  _count?: { commands: number };
}): VoiceSessionRecord {
  return {
    id: session.id,
    businessId: session.businessId,
    staffId: session.staffId,
    staffName: session.staff?.fullName ?? null,
    customerId: session.customerId,
    customerName: session.customer?.name ?? null,
    conversationId: session.conversationId,
    status: session.status,
    language: session.language,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString() ?? null,
    metadata: (session.metadata as Record<string, unknown>) ?? {},
    commandCount: session._count?.commands ?? 0,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

export function serializeVoiceCommand(command: {
  id: string;
  voiceSessionId: string;
  command: string;
  intent: string | null;
  confidenceScore: number | null;
  action: string | null;
  status: VoiceCommandStatus;
  metadata: unknown;
  createdAt: Date;
}): VoiceCommandRecord {
  return {
    id: command.id,
    voiceSessionId: command.voiceSessionId,
    command: command.command,
    intent: command.intent,
    confidenceScore: command.confidenceScore,
    action: command.action,
    status: command.status,
    metadata: (command.metadata as Record<string, unknown>) ?? {},
    createdAt: command.createdAt.toISOString(),
  };
}

export function validateVoiceSessionListQuery(query: VoiceSessionListQuery): VoiceSessionListQuery {
  return {
    page: Math.max(1, query.page ?? 1),
    pageSize: Math.min(100, Math.max(1, query.pageSize ?? 20)),
    search: query.search?.trim() || undefined,
    status: query.status ?? "ALL",
    language: query.language && query.language !== "ALL" ? query.language : undefined,
  };
}

export function validateVoiceCommandListQuery(query: VoiceCommandListQuery): VoiceCommandListQuery {
  return {
    page: Math.max(1, query.page ?? 1),
    pageSize: Math.min(100, Math.max(1, query.pageSize ?? 20)),
    search: query.search?.trim() || undefined,
    status: query.status ?? "ALL",
    intent: query.intent && query.intent !== "ALL" ? query.intent : undefined,
    voiceSessionId: query.voiceSessionId || undefined,
  };
}

export function parseVoiceSettings(metadata: unknown): VoiceSettings {
  const raw = (metadata as Partial<VoiceSettings> | null) ?? {};
  return {
    defaultLanguage: raw.defaultLanguage ?? DEFAULT_VOICE_SETTINGS.defaultLanguage,
    sttProviderId: raw.sttProviderId ?? DEFAULT_VOICE_SETTINGS.sttProviderId,
    ttsProviderId: raw.ttsProviderId ?? DEFAULT_VOICE_SETTINGS.ttsProviderId,
    voiceEnabled: raw.voiceEnabled ?? DEFAULT_VOICE_SETTINGS.voiceEnabled,
    autoRouteIntents: raw.autoRouteIntents ?? DEFAULT_VOICE_SETTINGS.autoRouteIntents,
  };
}

export function formatConfidence(score: number | null): string {
  if (score === null) return "—";
  return `${Math.round(score * 100)}%`;
}
