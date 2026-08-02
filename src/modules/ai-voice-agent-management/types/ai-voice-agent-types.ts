import type { VoiceCommandStatus, VoiceSessionStatus } from "@prisma/client";

export interface VoiceSessionRecord {
  id: string;
  businessId: string;
  staffId: string | null;
  staffName: string | null;
  customerId: string | null;
  customerName: string | null;
  conversationId: string | null;
  status: VoiceSessionStatus;
  language: string;
  startedAt: string;
  endedAt: string | null;
  metadata: Record<string, unknown>;
  commandCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceCommandRecord {
  id: string;
  voiceSessionId: string;
  command: string;
  intent: string | null;
  confidenceScore: number | null;
  action: string | null;
  status: VoiceCommandStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface VoiceSessionListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: VoiceSessionStatus | "ALL";
  language?: string;
}

export interface VoiceCommandListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: VoiceCommandStatus | "ALL";
  intent?: string;
  voiceSessionId?: string;
}

export interface VoiceSettings {
  defaultLanguage: string;
  sttProviderId: string | null;
  ttsProviderId: string | null;
  voiceEnabled: boolean;
  autoRouteIntents: boolean;
}

export interface VoiceIntentDefinition {
  intent: string;
  label: string;
  description: string;
  exampleCommands: string[];
  routePath?: string;
}

export interface VoiceActivityPoint {
  label: string;
  sessions: number;
  commands: number;
}

export interface VoiceAnalyticsSnapshot {
  totalSessions: number;
  activeSessions: number;
  totalCommands: number;
  processedCommands: number;
  failedCommands: number;
  successRate: number;
  topIntents: Array<{ intent: string; count: number }>;
  activityTimeline: VoiceActivityPoint[];
}

export interface ProcessVoiceCommandResult {
  command: VoiceCommandRecord;
  responseText: string;
  routePath: string | null;
}
