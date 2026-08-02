import "server-only";

import { prisma } from "@/lib/prisma";

export async function writeAppMarketplaceAuditLog(
  businessId: string,
  input: { action: string; entityId: string; message: string },
) {
  const app = await prisma.platformMarketplaceApp.findFirst({
    where: { slug: "__audit_store__" },
  });

  if (!app) {
    await prisma.platformMarketplaceApp.create({
      data: {
        name: "__audit_store__",
        slug: "__audit_store__",
        description: JSON.stringify({
          auditLogs: [{ ...input, at: new Date().toISOString(), businessId }],
        }),
        status: "DISABLED",
      },
    });
    return;
  }

  let auditLogs: Array<Record<string, unknown>> = [];
  try {
    const parsed = JSON.parse(app.description) as { auditLogs?: Array<Record<string, unknown>> };
    auditLogs = parsed.auditLogs ?? [];
  } catch {
    auditLogs = [];
  }

  auditLogs.unshift({ ...input, at: new Date().toISOString(), businessId });
  await prisma.platformMarketplaceApp.update({
    where: { id: app.id },
    data: { description: JSON.stringify({ auditLogs: auditLogs.slice(0, 100) }) },
  });
}
