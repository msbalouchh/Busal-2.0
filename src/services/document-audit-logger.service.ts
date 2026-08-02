import "server-only";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/document-platform-context.service";

export async function writeDocumentAuditLog(
  businessId: string,
  input: { action: string; entityId: string; message: string; metadata?: Record<string, unknown> },
) {
  const folder = await prisma.platformDocumentFolder.findFirst({
    where: { businessId, name: "System" },
    select: { id: true, description: true },
  });

  if (!folder) {
    await prisma.platformDocumentFolder.create({
      data: {
        businessId,
        name: "System",
        description: JSON.stringify({
          auditLogs: [
            {
              action: input.action,
              entityId: input.entityId,
              message: input.message,
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      },
    });
    return;
  }

  let auditLogs: Array<Record<string, unknown>> = [];
  try {
    const parsed = JSON.parse(folder.description) as { auditLogs?: Array<Record<string, unknown>> };
    auditLogs = parsed.auditLogs ?? [];
  } catch {
    auditLogs = [];
  }

  auditLogs.unshift({
    action: input.action,
    entityId: input.entityId,
    message: input.message,
    timestamp: new Date().toISOString(),
    ...(input.metadata ?? {}),
  });

  await prisma.platformDocumentFolder.update({
    where: { id: folder.id },
    data: {
      description: JSON.stringify({ auditLogs: auditLogs.slice(0, 100) }),
    },
  });
}

export async function listDocumentAuditLogs(ownerId: string, limit = 50) {
  const businessId = await getOwnedBusinessId(ownerId);
  const folder = await prisma.platformDocumentFolder.findFirst({
    where: { businessId, name: "System" },
  });
  if (!folder) return [];

  try {
    const parsed = JSON.parse(folder.description) as { auditLogs?: Array<Record<string, unknown>> };
    return (parsed.auditLogs ?? []).slice(0, limit).map((log, index) => ({
      id: String(log.entityId ?? index),
      action: String(log.action ?? ""),
      message: String(log.message ?? ""),
      timestamp: String(log.timestamp ?? ""),
    }));
  } catch {
    return [];
  }
}
