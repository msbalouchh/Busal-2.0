import type { VoiceSessionStatus } from "@prisma/client";

export const AI_VOICE_AGENT_ROUTES = {
  dashboard: () => `/app/ai/voice`,
  sessions: () => `/app/ai/voice/sessions`,
  sessionDetail: (sessionId: string) => `/app/ai/voice/sessions/${sessionId}`,
  commands: () => `/app/ai/voice/commands`,
  analytics: () => `/app/ai/voice/analytics`,
  settings: () => `/app/ai/voice/settings`,
  search: () => `/app/ai/voice/search`,
} as const;

export const VOICE_SESSION_STATUS_OPTIONS: Array<{
  value: VoiceSessionStatus | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const VOICE_COMMAND_STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSED", label: "Processed" },
  { value: "FAILED", label: "Failed" },
] as const;

export const VOICE_AGENT_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: AI_VOICE_AGENT_ROUTES.dashboard() },
  { id: "sessions", label: "Sessions", href: AI_VOICE_AGENT_ROUTES.sessions() },
  { id: "commands", label: "Commands", href: AI_VOICE_AGENT_ROUTES.commands() },
  { id: "analytics", label: "Analytics", href: AI_VOICE_AGENT_ROUTES.analytics() },
  { id: "settings", label: "Settings", href: AI_VOICE_AGENT_ROUTES.settings() },
  { id: "search", label: "Search", href: AI_VOICE_AGENT_ROUTES.search() },
] as const;
