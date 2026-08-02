import "server-only";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/document-platform-context.service";

export async function canAccessDocument(
  ownerId: string,
  documentId: string,
  permission: "view" | "update" | "delete" | "export",
): Promise<boolean> {
  void permission;
  const businessId = await getOwnedBusinessId(ownerId);
  const document = await prisma.platformDocument.findFirst({
    where: { id: documentId, businessId },
  });
  return Boolean(document);
}

export async function getDocumentSharingFramework(documentId: string) {
  return {
    documentId,
    sharingEnabled: false,
    frameworkOnly: true,
    message: "Document sharing framework — no external links generated",
  };
}
