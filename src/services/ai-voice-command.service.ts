import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  serializeVoiceCommand,
  validateVoiceCommandListQuery,
} from "@/modules/ai-voice-agent-management/lib/ai-voice-agent-validation";
import type {
  ProcessVoiceCommandResult,
  VoiceCommandListQuery,
  VoiceCommandRecord,
} from "@/modules/ai-voice-agent-management/types/ai-voice-agent-types";
import { getOwnedBusinessId } from "@/services/ai-voice-context.service";
import { detectVoiceIntent, routeVoiceIntent } from "@/services/ai-voice-intent-routing.service";

export async function listVoiceCommands(
  ownerId: string,
  query: VoiceCommandListQuery = {},
): Promise<{ items: VoiceCommandRecord[]; total: number; page: number; pageSize: number }> {
  const validated = validateVoiceCommandListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

  const where: Prisma.AIVoiceCommandWhereInput = {
    voiceSession: { businessId },
    ...(validated.status && validated.status !== "ALL" ? { status: validated.status } : {}),
    ...(validated.intent ? { intent: validated.intent } : {}),
    ...(validated.voiceSessionId ? { voiceSessionId: validated.voiceSessionId } : {}),
    ...(validated.search?.trim()
      ? {
          OR: [
            { command: { contains: validated.search.trim(), mode: "insensitive" } },
            { intent: { contains: validated.search.trim(), mode: "insensitive" } },
            { action: { contains: validated.search.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.aIVoiceCommand.count({ where }),
    prisma.aIVoiceCommand.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { items: items.map(serializeVoiceCommand), total, page, pageSize };
}

export async function getVoiceCommandsForSession(
  ownerId: string,
  sessionId: string,
): Promise<VoiceCommandRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const session = await prisma.aIVoiceSession.findFirst({
    where: { id: sessionId, businessId },
    select: { id: true },
  });
  if (!session) return [];

  const commands = await prisma.aIVoiceCommand.findMany({
    where: { voiceSessionId: sessionId },
    orderBy: { createdAt: "asc" },
  });

  return commands.map(serializeVoiceCommand);
}

export async function processVoiceCommand(
  ownerId: string,
  voiceSessionId: string,
  commandText: string,
): Promise<ProcessVoiceCommandResult> {
  const businessId = await getOwnedBusinessId(ownerId);
  const session = await prisma.aIVoiceSession.findFirst({
    where: { id: voiceSessionId, businessId, status: { in: ["ACTIVE", "PAUSED"] } },
  });

  if (!session) {
    throw new Error("Voice session not found or not active");
  }

  const detection = detectVoiceIntent(commandText);
  const routing = routeVoiceIntent(detection);
  const isUnknown = detection.intent === "unknown";

  const record = await prisma.aIVoiceCommand.create({
    data: {
      voiceSessionId,
      command: commandText.trim(),
      intent: detection.intent,
      confidenceScore: detection.confidence,
      action: routing.action,
      status: isUnknown ? "FAILED" : "PROCESSED",
      metadata: {
        routePath: routing.routePath,
        parameters: routing.parameters,
        responseText: detection.responseText,
      },
    },
  });

  return {
    command: serializeVoiceCommand(record),
    responseText: detection.responseText,
    routePath: routing.routePath,
  };
}

export async function searchVoiceCommands(
  ownerId: string,
  search: string,
): Promise<VoiceCommandRecord[]> {
  const result = await listVoiceCommands(ownerId, { search, pageSize: 20 });
  return result.items;
}
