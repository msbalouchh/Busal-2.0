import "server-only";

import type { PlatformMarketplaceAppStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { computeAppChecksum } from "@/services/app-marketplace-context.service";

export async function listMarketplaceApps(filters?: {
  category?: string;
  status?: PlatformMarketplaceAppStatus;
  search?: string;
}) {
  return prisma.platformMarketplaceApp.findMany({
    where: {
      slug: { not: "__audit_store__" },
      status: filters?.status ?? "PUBLISHED",
      ...(filters?.category ? { category: filters.category } : {}),
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { description: { contains: filters.search, mode: "insensitive" } },
              { developer: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { reviews: true, installedApps: true, versions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getMarketplaceApp(appIdOrSlug: string) {
  return prisma.platformMarketplaceApp.findFirst({
    where: { OR: [{ id: appIdOrSlug }, { slug: appIdOrSlug }] },
    include: {
      versions: { orderBy: { publishedAt: "desc" } },
      reviews: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { installedApps: true, reviews: true, versions: true } },
    },
  });
}

export async function registerMarketplaceApp(input: {
  name: string;
  slug: string;
  description?: string;
  developer?: string;
  category?: string;
  pricingModel?: "FREE" | "PAID" | "SUBSCRIPTION" | "ENTERPRISE";
  metadata?: Record<string, unknown>;
}) {
  const checksum = computeAppChecksum(JSON.stringify(input));
  const app = await prisma.platformMarketplaceApp.create({
    data: {
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      description: input.description?.trim() ?? "",
      developer: input.developer?.trim() ?? "Busal",
      category: input.category ?? "business",
      pricingModel: input.pricingModel ?? "FREE",
      status: "PUBLISHED",
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  await prisma.platformMarketplaceAppVersion.create({
    data: {
      appId: app.id,
      version: "1.0.0",
      releaseNotes: "Initial release",
      downloadUrl: `virtual://apps/${app.slug}/1.0.0`,
      checksum,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  return app;
}

export async function ensureDefaultMarketplaceCatalog() {
  const count = await prisma.platformMarketplaceApp.count();
  if (count > 0) return;

  const defaults = [
    { name: "CRM Pro", slug: "crm-pro", category: "business", developer: "Busal" },
    { name: "AI Assistant Pack", slug: "ai-assistant-pack", category: "ai", developer: "Busal AI" },
    {
      name: "Automation Starter",
      slug: "automation-starter",
      category: "automation",
      developer: "Busal",
    },
  ];

  for (const app of defaults) {
    await registerMarketplaceApp(app);
  }
}

export async function searchMarketplaceApps(query: string) {
  return listMarketplaceApps({ search: query.trim() });
}

export async function getMarketplaceHomeSummary() {
  const [totalApps, categories] = await Promise.all([
    prisma.platformMarketplaceApp.count({
      where: { status: "PUBLISHED", slug: { not: "__audit_store__" } },
    }),
    prisma.platformMarketplaceApp.groupBy({
      by: ["category"],
      where: { status: "PUBLISHED", slug: { not: "__audit_store__" } },
      _count: { id: true },
    }),
  ]);

  return {
    totalApps,
    categories: categories.map((row) => ({
      category: row.category,
      count: row._count.id,
    })),
  };
}
