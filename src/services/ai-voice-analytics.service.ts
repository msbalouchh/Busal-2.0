import "server-only";

import { prisma } from "@/lib/prisma";
import {
  serializeVoiceCommand,
  serializeVoiceSession,
} from "@/modules/ai-voice-agent-management/lib/ai-voice-agent-validation";
import type {
  VoiceActivityPoint,
  VoiceAnalyticsSnapshot,
} from "@/modules/ai-voice-agent-management/types/ai-voice-agent-types";
import { getOwnedBusinessId } from "@/services/ai-voice-context.service";
import { listVoiceIntents } from "@/services/ai-voice-intent-routing.service";

export interface VoiceAgentDashboardStats {
  totalSessions: number;
  activeSessions: number;
  totalCommands: number;
  processedCommands: number;
  successRate: number;
}

export async function getVoiceAgentDashboardStats(
  ownerId: string,
): Promise<VoiceAgentDashboardStats> {
  const businessId = await getOwnedBusinessId(ownerId);

  const [sessionCounts, commandCounts] = await Promise.all([
    prisma.aIVoiceSession.groupBy({
      by: ["status"],
      where: { businessId },
      _count: { _all: true },
    }),
    prisma.aIVoiceCommand.groupBy({
      by: ["status"],
      where: { voiceSession: { businessId } },
      _count: { _all: true },
    }),
  ]);

  const totalSessions = sessionCounts.reduce((sum, row) => sum + row._count._all, 0);
  const activeSessions = sessionCounts.find((row) => row.status === "ACTIVE")?._count._all ?? 0;
  const totalCommands = commandCounts.reduce((sum, row) => sum + row._count._all, 0);
  const processedCommands =
    commandCounts.find((row) => row.status === "PROCESSED")?._count._all ?? 0;
  const successRate =
    totalCommands > 0 ? Math.round((processedCommands / totalCommands) * 100) : 100;

  return { totalSessions, activeSessions, totalCommands, processedCommands, successRate };
}

export async function getVoiceAnalyticsSnapshot(ownerId: string): Promise<VoiceAnalyticsSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const stats = await getVoiceAgentDashboardStats(ownerId);

  const intentGroups = await prisma.aIVoiceCommand.groupBy({
    by: ["intent"],
    where: { voiceSession: { businessId }, intent: { not: null } },
    _count: { _all: true },
  });

  const topIntents = intentGroups
    .filter((row) => row.intent)
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 8)
    .map((row) => ({ intent: row.intent as string, count: row._count._all }));

  const [recentSessions, recentCommands] = await Promise.all([
    prisma.aIVoiceSession.findMany({
      where: { businessId },
      select: { startedAt: true },
      orderBy: { startedAt: "desc" },
      take: 100,
    }),
    prisma.aIVoiceCommand.findMany({
      where: { voiceSession: { businessId } },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const failedCommands =
    (await prisma.aIVoiceCommand.count({
      where: { voiceSession: { businessId }, status: "FAILED" },
    })) ?? 0;

  const activityTimeline = buildActivityTimeline(recentSessions, recentCommands);

  return {
    totalSessions: stats.totalSessions,
    activeSessions: stats.activeSessions,
    totalCommands: stats.totalCommands,
    processedCommands: stats.processedCommands,
    failedCommands,
    successRate: stats.successRate,
    topIntents,
    activityTimeline,
  };
}

function buildActivityTimeline(
  sessions: Array<{ startedAt: Date }>,
  commands: Array<{ createdAt: Date }>,
): VoiceActivityPoint[] {
  const buckets = new Map<string, VoiceActivityPoint>();

  for (const session of sessions) {
    const label = session.startedAt.toISOString().slice(0, 10);
    const current = buckets.get(label) ?? { label, sessions: 0, commands: 0 };
    current.sessions += 1;
    buckets.set(label, current);
  }

  for (const command of commands) {
    const label = command.createdAt.toISOString().slice(0, 10);
    const current = buckets.get(label) ?? { label, sessions: 0, commands: 0 };
    current.commands += 1;
    buckets.set(label, current);
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(-7);
}

export async function getVoiceAgentSummary(ownerId: string) {
  const [stats, sessions, commands, analytics, intents] = await Promise.all([
    getVoiceAgentDashboardStats(ownerId),
    listRecentVoiceSessions(ownerId, 5),
    listRecentVoiceCommands(ownerId, 5),
    getVoiceAnalyticsSnapshot(ownerId),
    Promise.resolve(listVoiceIntents()),
  ]);

  return { stats, sessions, commands, analytics, intents };
}

async function listRecentVoiceSessions(ownerId: string, limit: number) {
  const businessId = await getOwnedBusinessId(ownerId);
  const items = await prisma.aIVoiceSession.findMany({
    where: { businessId },
    include: {
      staff: { select: { fullName: true } },
      customer: { select: { name: true } },
      _count: { select: { commands: true } },
    },
    orderBy: { startedAt: "desc" },
    take: limit,
  });

  return items.map(serializeVoiceSession);
}

async function listRecentVoiceCommands(ownerId: string, limit: number) {
  const businessId = await getOwnedBusinessId(ownerId);
  const items = await prisma.aIVoiceCommand.findMany({
    where: { voiceSession: { businessId } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return items.map(serializeVoiceCommand);
}
