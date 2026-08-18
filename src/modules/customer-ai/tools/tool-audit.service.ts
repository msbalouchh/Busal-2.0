import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { AiToolRiskLevel, AiToolAudience } from "@/modules/customer-ai/tools/tool-types";

function sanitizeSummary(value: unknown): string {
  if (value === undefined || value === null) return "";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.slice(0, 500);
}

export async function recordAiBusinessAction(input: {
  businessId: string;
  toolId: string;
  audience: AiToolAudience;
  riskLevel: AiToolRiskLevel;
  customerId?: string | null;
  conversationId?: string | null;
  sessionId?: string | null;
  channel?: string;
  entityType?: string | null;
  entityId?: string | null;
  permissionGranted: boolean;
  confirmationRequired: boolean;
  confirmationStatus: "not_required" | "pending" | "confirmed" | "rejected" | "expired";
  executionStatus: "skipped" | "executed" | "failed";
  success: boolean;
  inputSummary?: Record<string, unknown>;
  outputSummary?: Record<string, unknown>;
  errorMessage?: string | null;
}): Promise<void> {
  await prisma.customerAiActionLog.create({
    data: {
      businessId: input.businessId,
      toolId: input.toolId,
      audience: input.audience,
      riskLevel: input.riskLevel,
      customerId: input.customerId ?? null,
      conversationId: input.conversationId ?? null,
      sessionId: input.sessionId ?? null,
      channel: input.channel ?? "website",
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      permissionGranted: input.permissionGranted,
      confirmationRequired: input.confirmationRequired,
      confirmationStatus: input.confirmationStatus,
      executionStatus: input.executionStatus,
      success: input.success,
      inputSummary: sanitizeSummary(input.inputSummary),
      outputSummary: sanitizeSummary(input.outputSummary),
      errorMessage: input.errorMessage ?? null,
    },
  });

  await prisma.aiAgentAuditLog
    .create({
      data: {
        businessId: input.businessId,
        entityType: "ai_business_action",
        entityId: input.entityId ?? input.toolId,
        action: input.toolId,
        metadata: {
          audience: input.audience,
          riskLevel: input.riskLevel,
          conversationId: input.conversationId,
          channel: input.channel,
          permissionGranted: input.permissionGranted,
          confirmationStatus: input.confirmationStatus,
          executionStatus: input.executionStatus,
          success: input.success,
          outputPreview: sanitizeSummary(input.outputSummary),
        } as Prisma.InputJsonValue,
      },
    })
    .catch(() => undefined);
}

export async function listAiBusinessActions(
  businessId: string,
  limit = 50,
): Promise<
  Array<{
    id: string;
    toolId: string;
    audience: string;
    success: boolean;
    executionStatus: string;
    channel: string;
    entityType: string | null;
    entityId: string | null;
    createdAt: string;
  }>
> {
  const rows = await prisma.customerAiActionLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      toolId: true,
      audience: true,
      success: true,
      executionStatus: true,
      channel: true,
      entityType: true,
      entityId: true,
      createdAt: true,
    },
  });

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));
}
