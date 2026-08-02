import "server-only";

import type { PlatformDocumentType, PlatformTemplateStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/document-platform-context.service";

export async function listDocumentTemplates(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformDocumentTemplate.findMany({
    where: { businessId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createDocumentTemplate(
  ownerId: string,
  input: {
    name: string;
    slug: string;
    documentType: PlatformDocumentType;
    content: string;
    variables?: string[];
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformDocumentTemplate.create({
    data: {
      businessId,
      name: input.name,
      slug: input.slug,
      documentType: input.documentType,
      content: input.content,
      variables: (input.variables ?? []) as Prisma.InputJsonValue,
      status: "DRAFT",
    },
  });
}

export async function updateDocumentTemplate(
  ownerId: string,
  templateId: string,
  input: {
    name?: string;
    content?: string;
    variables?: string[];
    status?: PlatformTemplateStatus;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformDocumentTemplate.findFirst({
    where: { id: templateId, businessId },
  });
  if (!existing) return null;

  return prisma.platformDocumentTemplate.update({
    where: { id: templateId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.variables !== undefined
        ? { variables: input.variables as Prisma.InputJsonValue }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  });
}

export async function deleteDocumentTemplate(ownerId: string, templateId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformDocumentTemplate.findFirst({
    where: { id: templateId, businessId },
  });
  if (!existing) return false;
  await prisma.platformDocumentTemplate.delete({ where: { id: templateId } });
  return true;
}

export function renderDocumentTemplate(content: string, variables: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? "");
}
