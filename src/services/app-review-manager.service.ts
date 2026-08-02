import "server-only";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/app-marketplace-context.service";

export async function listAppReviews(appId: string) {
  return prisma.platformMarketplaceAppReview.findMany({
    where: { appId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAppReview(
  ownerId: string,
  input: { appId: string; rating: number; review?: string },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const rating = Math.min(5, Math.max(1, input.rating));

  return prisma.platformMarketplaceAppReview.upsert({
    where: { appId_businessId: { appId: input.appId, businessId } },
    create: {
      appId: input.appId,
      businessId,
      rating,
      review: input.review?.trim() ?? "",
    },
    update: {
      rating,
      review: input.review?.trim() ?? "",
    },
  });
}

export async function getAppRatingSummary(appId: string) {
  const reviews = await prisma.platformMarketplaceAppReview.findMany({
    where: { appId },
    select: { rating: true },
  });
  if (reviews.length === 0) return { average: 0, count: 0 };
  const average = reviews.reduce((sum, row) => sum + row.rating, 0) / reviews.length;
  return { average: Math.round(average * 10) / 10, count: reviews.length };
}

export async function listBusinessReviews(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformMarketplaceAppReview.findMany({
    where: { businessId },
    include: { app: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
}
