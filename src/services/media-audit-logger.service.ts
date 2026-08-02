import "server-only";

import { prisma } from "@/lib/prisma";

export async function writeMediaAuditLog(
  businessId: string,
  input: { action: string; entityId: string; message: string; metadata?: Record<string, unknown> },
) {
  const folder = await prisma.platformMediaFolder.findFirst({
    where: { businessId, name: "System" },
    select: { id: true, description: true },
  });

  if (!folder) {
    await prisma.platformMediaFolder.create({
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

  await prisma.platformMediaFolder.update({
    where: { id: folder.id },
    data: {
      description: JSON.stringify({ auditLogs: auditLogs.slice(0, 100) }),
    },
  });
}
