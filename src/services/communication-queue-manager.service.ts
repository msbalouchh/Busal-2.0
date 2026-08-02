import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

export function checkCommunicationRateLimit(businessId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(businessId);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(businessId, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function enqueueCommunicationMessage(businessId: string, messageId: string) {
  if (!checkCommunicationRateLimit(businessId)) {
    throw new Error("Rate limit exceeded for communication messages");
  }

  await prisma.platformCommunicationMessage.update({
    where: { id: messageId },
    data: {
      status: "QUEUED",
      metadata: {
        queuedAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
}

export async function listQueuedMessages(ownerId: string, businessId: string) {
  void ownerId;
  return prisma.platformCommunicationMessage.findMany({
    where: { businessId, status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
}

export async function processMessageQueue(businessId: string) {
  const queued = await prisma.platformCommunicationMessage.findMany({
    where: { businessId, status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  return queued.length;
}
