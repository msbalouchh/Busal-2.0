import "server-only";

/** Non-inference service — no parallel AI execution. */

import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_VOICE_SETTINGS,
  parseVoiceSettings,
} from "@/modules/ai-voice-agent-management/lib/ai-voice-agent-validation";
import type { VoiceSettings } from "@/modules/ai-voice-agent-management/types/ai-voice-agent-types";

export async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function getStaffIdForUser(
  businessId: string,
  userId: string,
): Promise<string | null> {
  const staff = await prisma.staff.findFirst({
    where: { businessId, userId, isActive: true },
    select: { id: true },
  });
  return staff?.id ?? null;
}

export async function getVoiceSettings(ownerId: string): Promise<VoiceSettings> {
  const businessId = await getOwnedBusinessId(ownerId);
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { businessDna: true },
  });

  const dna = (business?.businessDna as Record<string, unknown> | null) ?? {};
  const voiceSettings = dna.voiceSettings;
  return parseVoiceSettings(voiceSettings ?? DEFAULT_VOICE_SETTINGS);
}

export async function updateVoiceSettings(
  ownerId: string,
  settings: Partial<VoiceSettings>,
): Promise<VoiceSettings> {
  const businessId = await getOwnedBusinessId(ownerId);
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { businessDna: true },
  });

  const dna = (business?.businessDna as Record<string, unknown> | null) ?? {};
  const current = parseVoiceSettings(dna.voiceSettings);
  const next = { ...current, ...settings };

  await prisma.business.update({
    where: { id: businessId },
    data: {
      businessDna: {
        ...dna,
        voiceSettings: next,
      },
    },
  });

  return next;
}

export async function getVoiceSessionContext(ownerId: string, sessionId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const session = await prisma.aIVoiceSession.findFirst({
    where: { id: sessionId, businessId },
    include: {
      staff: { select: { fullName: true } },
      customer: { select: { name: true } },
      commands: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!session) return null;

  const settings = await getVoiceSettings(ownerId);

  return {
    session,
    settings,
    recentCommands: session.commands,
  };
}
