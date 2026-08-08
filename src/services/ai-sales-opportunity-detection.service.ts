import "server-only";

import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import {
  createSalesInsight,
  createSalesRecommendation,
} from "@/services/ai-sales-recommendation.service";
import {
  runOwnerDomainDetectionTask,
  runOwnerDomainInsightTask,
} from "@/services/ai-domain-insight-runner.service";

export interface SalesOpportunityItem {
  id: string;
  title: string;
  type: "lead" | "opportunity" | "customer" | "quote";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  action: string;
  metadata: Record<string, unknown>;
}

const INACTIVE_DAYS = 60;

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function detectSalesOpportunities(ownerId: string): Promise<SalesOpportunityItem[]> {
  return runOwnerDomainDetectionTask<SalesOpportunityItem>(ownerId, {
    module: "sales",
    task: "sales-opportunity-detection",
    responseKey: "opportunities",
    loadContext: async (id) => {
      const businessId = await getOwnedBusinessId(id);
      const [leads, openOpportunities, inactiveCustomers] = await Promise.all([
        prisma.salesLead.findMany({
          where: { businessId, deletedAt: null, status: { in: ["NEW", "CONTACTED", "QUALIFIED"] } },
          orderBy: { estimatedValuePence: "desc" },
          take: 5,
        }),
        prisma.salesOpportunity.findMany({
          where: { businessId, deletedAt: null, stage: { isWon: false, isLost: false } },
          include: { stage: true },
          orderBy: { valuePence: "desc" },
          take: 5,
        }),
        prisma.customer.findMany({
          where: {
            businessId,
            deletedAt: null,
            status: "ACTIVE",
            OR: [
              { lastOrderAt: { lt: new Date(Date.now() - INACTIVE_DAYS * 86400000) } },
              { lastOrderAt: null, createdAt: { lt: new Date(Date.now() - INACTIVE_DAYS * 86400000) } },
            ],
          },
          orderBy: { totalSpend: "desc" },
          take: 5,
        }),
      ]);
      return { leads, openOpportunities, inactiveCustomers, inactiveDaysThreshold: INACTIVE_DAYS };
    },
  });
}

export async function generateOpportunityRecommendations(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "sales",
    task: "opportunity-recommendations",
    loadContext: async (ownerId) => ({ ownerId }),
    persistInsight: (businessId, insight) =>
      createSalesInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "customers",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
    persistRecommendation: (businessId, recommendation) =>
      createSalesRecommendation(businessId, {
        title: recommendation.title,
        description: recommendation.description,
        action: recommendation.action ?? recommendation.recommendation ?? "Review AI recommendation",
        priority: (recommendation.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        expectedImpact: recommendation.expectedImpact,
        metadata: recommendation.metadata,
      }),
  });
}

export async function getFollowUpSuggestions(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);

  const [tasks, demos, contacts] = await Promise.all([
    prisma.salesTask.findMany({
      where: { businessId, status: { in: ["PENDING", "IN_PROGRESS"] } },
      orderBy: { dueAt: "asc" },
      take: 10,
    }),
    prisma.salesDemo.findMany({
      where: { businessId, status: "SCHEDULED", scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
    prisma.customer.findMany({
      where: {
        businessId,
        deletedAt: null,
        status: "ACTIVE",
        OR: [{ lastOrderAt: { lt: new Date(Date.now() - 30 * 86400000) } }, { lastOrderAt: null }],
      },
      orderBy: { totalSpend: "desc" },
      take: 5,
      select: { id: true, name: true, lastOrderAt: true, totalSpend: true },
    }),
  ]);

  return { tasks, demos, contacts };
}
