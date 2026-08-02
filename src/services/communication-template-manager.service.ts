import "server-only";

import type { PlatformChannelType, PlatformTemplateStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/communication-platform-context.service";

export async function listCommunicationTemplates(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformCommunicationTemplate.findMany({
    where: { businessId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createCommunicationTemplate(
  ownerId: string,
  input: {
    name: string;
    slug: string;
    channel: PlatformChannelType;
    subject?: string;
    content: string;
    variables?: string[];
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformCommunicationTemplate.create({
    data: {
      businessId,
      name: input.name,
      slug: input.slug,
      channel: input.channel,
      subject: input.subject ?? "",
      content: input.content,
      variables: (input.variables ?? []) as Prisma.InputJsonValue,
      status: "DRAFT",
    },
  });
}

export async function updateCommunicationTemplate(
  ownerId: string,
  templateId: string,
  input: {
    name?: string;
    subject?: string;
    content?: string;
    variables?: string[];
    status?: PlatformTemplateStatus;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformCommunicationTemplate.findFirst({
    where: { id: templateId, businessId },
  });
  if (!existing) return null;

  return prisma.platformCommunicationTemplate.update({
    where: { id: templateId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.variables !== undefined
        ? { variables: input.variables as Prisma.InputJsonValue }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  });
}

export async function deleteCommunicationTemplate(ownerId: string, templateId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformCommunicationTemplate.findFirst({
    where: { id: templateId, businessId },
  });
  if (!existing) return false;
  await prisma.platformCommunicationTemplate.delete({ where: { id: templateId } });
  return true;
}

export function renderTemplateContent(content: string, variables: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? "");
}
