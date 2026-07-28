import type { MonitoringLogLevel } from "@prisma/client";

export function matchesLogLevelFilter(
  level: MonitoringLogLevel,
  filter?: MonitoringLogLevel,
): boolean {
  if (!filter) {
    return true;
  }

  return level === filter;
}

export function matchesLogSearch(query: string, message: string, source: string): boolean {
  const normalized = query.toLowerCase();
  return message.toLowerCase().includes(normalized) || source.toLowerCase().includes(normalized);
}

export function matchesCorrelationFilter(
  correlationId: string | null | undefined,
  filter?: string | null,
): boolean {
  if (!filter) {
    return true;
  }

  return correlationId === filter;
}

export function resolveRetentionCutoff(retentionDays: number, now = new Date()): Date {
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}

export function shouldArchive(
  archiveEnabled: boolean,
  ageDays: number,
  retentionDays: number,
): boolean {
  return archiveEnabled && ageDays > retentionDays;
}

export const LOG_LEVEL_PRIORITY: Record<MonitoringLogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  CRITICAL: 4,
};
