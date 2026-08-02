import "server-only";

import type { Prisma, VoiceSessionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  serializeVoiceSession,
  validateVoiceSessionListQuery,
} from "@/modules/ai-voice-agent-management/lib/ai-voice-agent-validation";
import type {
  VoiceSessionListQuery,
  VoiceSessionRecord,
} from "@/modules/ai-voice-agent-management/types/ai-voice-agent-types";
import { getOwnedBusinessId, getStaffIdForUser } from "@/services/ai-voice-context.service";

export async function listVoiceSessions(
  ownerId: string,
  query: VoiceSessionListQuery = {},
): Promise<{ items: VoiceSessionRecord[]; total: number; page: number; pageSize: number }> {
  const validated = validateVoiceSessionListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

  const where: Prisma.AIVoiceSessionWhereInput = {
    businessId,
    ...(validated.status && validated.status !== "ALL" ? { status: validated.status } : {}),
    ...(validated.language ? { language: validated.language } : {}),
    ...(validated.search?.trim()
      ? {
          OR: [
            { language: { contains: validated.search.trim(), mode: "insensitive" } },
            { staff: { fullName: { contains: validated.search.trim(), mode: "insensitive" } } },
            { customer: { name: { contains: validated.search.trim(), mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.aIVoiceSession.count({ where }),
    prisma.aIVoiceSession.findMany({
      where,
      include: {
        staff: { select: { fullName: true } },
        customer: { select: { name: true } },
        _count: { select: { commands: true } },
      },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { items: items.map(serializeVoiceSession), total, page, pageSize };
}

export async function getVoiceSessionById(
  ownerId: string,
  sessionId: string,
): Promise<VoiceSessionRecord | null> {
  const businessId = await getOwnedBusinessId(ownerId);
  const session = await prisma.aIVoiceSession.findFirst({
    where: { id: sessionId, businessId },
    include: {
      staff: { select: { fullName: true } },
      customer: { select: { name: true } },
      _count: { select: { commands: true } },
    },
  });

  return session ? serializeVoiceSession(session) : null;
}

export async function startVoiceSession(
  ownerId: string,
  input: {
    language?: string;
    customerId?: string;
    conversationId?: string;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<VoiceSessionRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const staffId = await getStaffIdForUser(businessId, ownerId);

  const session = await prisma.aIVoiceSession.create({
    data: {
      businessId,
      staffId,
      customerId: input.customerId ?? null,
      conversationId: input.conversationId ?? null,
      language: input.language ?? "en",
      status: "ACTIVE",
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
    include: {
      staff: { select: { fullName: true } },
      customer: { select: { name: true } },
      _count: { select: { commands: true } },
    },
  });

  return serializeVoiceSession(session);
}

export async function updateVoiceSessionStatus(
  ownerId: string,
  sessionId: string,
  status: VoiceSessionStatus,
): Promise<VoiceSessionRecord | null> {
  const businessId = await getOwnedBusinessId(ownerId);
  const endedAt = status === "COMPLETED" || status === "CANCELLED" ? new Date() : undefined;

  const session = await prisma.aIVoiceSession.updateMany({
    where: { id: sessionId, businessId },
    data: {
      status,
      ...(endedAt ? { endedAt } : {}),
    },
  });

  if (session.count === 0) return null;
  return getVoiceSessionById(ownerId, sessionId);
}

export async function searchVoiceSessions(
  ownerId: string,
  search: string,
): Promise<VoiceSessionRecord[]> {
  const result = await listVoiceSessions(ownerId, { search, pageSize: 20 });
  return result.items;
}
