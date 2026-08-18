import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** Default TTL for pending AI confirmations (15 minutes). */
export const AI_CONFIRMATION_TTL_MS = 15 * 60 * 1000;

export async function createPendingConfirmation(input: {
  businessId: string;
  actionId: string;
  toolId: string;
  conversationId?: string | null;
  sessionId?: string | null;
  channel?: string;
  payload?: Record<string, unknown>;
  ttlMs?: number;
}): Promise<{ actionId: string; expiresAt: string }> {
  const expiresAt = new Date(Date.now() + (input.ttlMs ?? AI_CONFIRMATION_TTL_MS));

  await prisma.customerAiPendingConfirmation.upsert({
    where: {
      businessId_actionId: {
        businessId: input.businessId,
        actionId: input.actionId,
      },
    },
    create: {
      businessId: input.businessId,
      actionId: input.actionId,
      toolId: input.toolId,
      conversationId: input.conversationId ?? null,
      sessionId: input.sessionId ?? null,
      channel: input.channel ?? "website",
      payload: (input.payload ?? {}) as Prisma.InputJsonValue,
      status: "pending",
      expiresAt,
    },
    update: {
      toolId: input.toolId,
      conversationId: input.conversationId ?? null,
      sessionId: input.sessionId ?? null,
      channel: input.channel ?? "website",
      payload: (input.payload ?? {}) as Prisma.InputJsonValue,
      status: "pending",
      expiresAt,
      consumedAt: null,
    },
  });

  return { actionId: input.actionId, expiresAt: expiresAt.toISOString() };
}

export type ConfirmationValidationResult =
  | { valid: true; actionId: string }
  | { valid: false; reason: "not_found" | "expired" | "already_consumed" | "not_confirmed" };

export async function validateConfirmedAction(input: {
  businessId: string;
  actionId: string;
  confirmedActions?: string[];
}): Promise<ConfirmationValidationResult> {
  if (!input.confirmedActions?.includes(input.actionId)) {
    return { valid: false, reason: "not_confirmed" };
  }

  const pending = await prisma.customerAiPendingConfirmation.findUnique({
    where: {
      businessId_actionId: {
        businessId: input.businessId,
        actionId: input.actionId,
      },
    },
  });

  if (!pending) {
    return { valid: false, reason: "not_found" };
  }

  if (pending.status === "consumed") {
    return { valid: false, reason: "already_consumed" };
  }

  if (pending.status === "expired" || pending.expiresAt.getTime() < Date.now()) {
    if (pending.status !== "expired") {
      await prisma.customerAiPendingConfirmation.update({
        where: { id: pending.id },
        data: { status: "expired" },
      });
    }
    return { valid: false, reason: "expired" };
  }

  return { valid: true, actionId: input.actionId };
}

export async function consumePendingConfirmation(
  businessId: string,
  actionId: string,
): Promise<boolean> {
  const result = await prisma.customerAiPendingConfirmation.updateMany({
    where: {
      businessId,
      actionId,
      status: "pending",
      expiresAt: { gt: new Date() },
    },
    data: { status: "consumed", consumedAt: new Date() },
  });
  return result.count === 1;
}

export async function expireStaleConfirmations(businessId?: string): Promise<number> {
  const result = await prisma.customerAiPendingConfirmation.updateMany({
    where: {
      ...(businessId ? { businessId } : {}),
      status: "pending",
      expiresAt: { lt: new Date() },
    },
    data: { status: "expired" },
  });
  return result.count;
}

export async function listPendingConfirmations(
  businessId: string,
  conversationId?: string,
): Promise<
  Array<{
    actionId: string;
    toolId: string;
    status: string;
    expiresAt: string;
    channel: string;
  }>
> {
  await expireStaleConfirmations(businessId);

  const rows = await prisma.customerAiPendingConfirmation.findMany({
    where: {
      businessId,
      status: "pending",
      ...(conversationId ? { conversationId } : {}),
    },
    orderBy: { expiresAt: "asc" },
    take: 20,
  });

  return rows.map((row) => ({
    actionId: row.actionId,
    toolId: row.toolId,
    status: row.status,
    expiresAt: row.expiresAt.toISOString(),
    channel: row.channel,
  }));
}

export async function listExpiredConfirmations(
  businessId: string,
  limit = 10,
): Promise<Array<{ actionId: string; toolId: string; expiresAt: string }>> {
  const rows = await prisma.customerAiPendingConfirmation.findMany({
    where: { businessId, status: "expired" },
    orderBy: { expiresAt: "desc" },
    take: limit,
    select: { actionId: true, toolId: true, expiresAt: true },
  });

  return rows.map((row) => ({
    actionId: row.actionId,
    toolId: row.toolId,
    expiresAt: row.expiresAt.toISOString(),
  }));
}
