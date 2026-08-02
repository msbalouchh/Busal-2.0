import "server-only";

import { prisma } from "@/lib/prisma";
import { moneyDecimalToPence } from "@/modules/payments/utils/currency";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createMarketingInsight } from "@/services/ai-marketing-recommendation.service";

export interface CustomerSegment {
  id: string;
  name: string;
  slug: string;
  customerCount: number;
  totalSpendPence: number;
  avgSpendPence: number;
  isSystem: boolean;
}

const INACTIVE_DAYS = 60;

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function listCustomerSegments(ownerId: string): Promise<CustomerSegment[]> {
  const businessId = await getOwnedBusinessId(ownerId);

  const groups = await prisma.customerGroup.findMany({
    where: { businessId },
    include: {
      customers: {
        where: { deletedAt: null },
        select: { totalSpend: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const segments: CustomerSegment[] = groups.map((group) => {
    const totalSpendPence = group.customers.reduce(
      (sum, customer) => sum + moneyDecimalToPence(customer.totalSpend),
      0,
    );
    const customerCount = group.customers.length;
    return {
      id: group.id,
      name: group.name,
      slug: group.slug,
      customerCount,
      totalSpendPence,
      avgSpendPence: customerCount > 0 ? Math.round(totalSpendPence / customerCount) : 0,
      isSystem: group.isSystem,
    };
  });

  const ungrouped = await prisma.customer.findMany({
    where: { businessId, deletedAt: null, groupId: null },
    select: { totalSpend: true },
  });

  if (ungrouped.length > 0) {
    const totalSpendPence = ungrouped.reduce(
      (sum, customer) => sum + moneyDecimalToPence(customer.totalSpend),
      0,
    );
    segments.push({
      id: "ungrouped",
      name: "Ungrouped",
      slug: "ungrouped",
      customerCount: ungrouped.length,
      totalSpendPence,
      avgSpendPence: Math.round(totalSpendPence / ungrouped.length),
      isSystem: false,
    });
  }

  const atRisk = await prisma.customer.count({
    where: {
      businessId,
      deletedAt: null,
      status: "ACTIVE",
      OR: [
        { lastOrderAt: { lt: new Date(Date.now() - INACTIVE_DAYS * 86400000) } },
        { lastOrderAt: null, createdAt: { lt: new Date(Date.now() - INACTIVE_DAYS * 86400000) } },
      ],
    },
  });

  if (atRisk > 0) {
    segments.push({
      id: "at-risk",
      name: "At-risk customers",
      slug: "at-risk",
      customerCount: atRisk,
      totalSpendPence: 0,
      avgSpendPence: 0,
      isSystem: true,
    });
  }

  return segments.sort((a, b) => b.totalSpendPence - a.totalSpendPence);
}

export async function generateSegmentationInsights(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const segments = await listCustomerSegments(ownerId);
  let created = 0;

  const topSegment = segments.find((s) => s.customerCount > 0 && s.slug !== "at-risk");
  if (topSegment) {
    await createMarketingInsight(businessId, {
      title: `Highest value segment: ${topSegment.name}`,
      description: `${topSegment.customerCount} customers with £${(topSegment.totalSpendPence / 100).toFixed(2)} total lifetime value.`,
      category: "segment",
      priority: "HIGH",
      recommendation: `Target ${topSegment.name} with personalized promotions to maximize LTV.`,
      metadata: { segmentId: topSegment.id },
    });
    created += 1;
  }

  const atRisk = segments.find((s) => s.slug === "at-risk");
  if (atRisk && atRisk.customerCount > 0) {
    await createMarketingInsight(businessId, {
      title: "Customers at risk of leaving",
      description: `${atRisk.customerCount} customers inactive for ${INACTIVE_DAYS}+ days.`,
      category: "retention",
      priority: "CRITICAL",
      recommendation: "Launch a win-back loyalty campaign with personalized offers.",
      metadata: { atRiskCount: atRisk.customerCount },
    });
    created += 1;
  }

  return created;
}

export async function getLoyaltyCampaignTargets(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.customer.findMany({
    where: {
      businessId,
      deletedAt: null,
      marketingConsent: true,
      loyaltyPoints: { gt: 0 },
    },
    orderBy: { loyaltyPoints: "desc" },
    take: 10,
    select: { id: true, name: true, loyaltyPoints: true, lastOrderAt: true },
  });
}
