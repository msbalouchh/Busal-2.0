import "server-only";

import { prisma } from "@/lib/prisma";
import { PLACEHOLDER_INTEGRATION_PROVIDERS } from "@/modules/integration-platform-management/plugins/bootstrap-integration-providers";
import { getOwnedBusinessId } from "@/services/integration-context.service";

export async function ensureIntegrationProvidersBootstrapped(ownerId: string): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existingCount = await prisma.integrationProvider.count({ where: { businessId } });
  if (existingCount > 0) return;

  await prisma.integrationProvider.createMany({
    data: PLACEHOLDER_INTEGRATION_PROVIDERS.map((provider) => ({
      businessId,
      name: provider.name,
      slug: provider.slug,
      category: provider.category,
      status: "INACTIVE",
      configuration: { description: provider.description, placeholder: true },
    })),
  });
}

export async function listIntegrationProviders(ownerId: string) {
  await ensureIntegrationProvidersBootstrapped(ownerId);
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.integrationProvider.findMany({
    where: { businessId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: { _count: { select: { connections: true, webhooks: true } } },
  });
}

export async function getIntegrationProviderById(ownerId: string, providerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.integrationProvider.findFirst({
    where: { id: providerId, businessId },
    include: { _count: { select: { connections: true, webhooks: true } } },
  });
}

export async function getIntegrationProviderBySlug(ownerId: string, slug: string) {
  await ensureIntegrationProvidersBootstrapped(ownerId);
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.integrationProvider.findFirst({
    where: { businessId, slug },
  });
}
