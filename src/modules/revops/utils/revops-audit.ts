import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function logRevopsAudit(
  businessId: string,
  input: {
    staffId?: string | null;
    entityType: string;
    entityId: string;
    action: string;
    metadata?: Prisma.InputJsonValue;
  },
  tx: Prisma.TransactionClient = prisma,
): Promise<void> {
  await tx.revopsAuditLog.create({
    data: {
      businessId,
      staffId: input.staffId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      metadata: input.metadata,
    },
  });
}
