import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logQuoteAudit(
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
  await tx.quoteAuditLog.create({
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
