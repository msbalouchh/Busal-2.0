import "server-only";

import { prisma } from "@/lib/prisma";
import { getCustomerAnalytics } from "@/services/reporting.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import {
  createSalesInsight,
  createSalesRecommendation,
} from "@/services/ai-sales-recommendation.service";

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
  const businessId = await getOwnedBusinessId(ownerId);
  const opportunities: SalesOpportunityItem[] = [];

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

  for (const lead of leads) {
    opportunities.push({
      id: lead.id,
      title: lead.title,
      type: "lead",
      priority: lead.estimatedValuePence > 100000 ? "HIGH" : "MEDIUM",
      description: `Lead valued at £${(lead.estimatedValuePence / 100).toFixed(2)} — status: ${lead.status}`,
      action: "Qualify and convert to opportunity",
      metadata: { leadId: lead.id, estimatedValuePence: lead.estimatedValuePence },
    });
  }

  for (const opportunity of openOpportunities) {
    opportunities.push({
      id: opportunity.id,
      title: opportunity.name,
      type: "opportunity",
      priority: opportunity.valuePence > 200000 ? "CRITICAL" : "HIGH",
      description: `${opportunity.stage.name} stage — £${(opportunity.valuePence / 100).toFixed(2)}`,
      action: "Advance to next pipeline stage",
      metadata: { opportunityId: opportunity.id, stageId: opportunity.stageId },
    });
  }

  for (const customer of inactiveCustomers) {
    opportunities.push({
      id: customer.id,
      title: `Re-engage ${customer.name}`,
      type: "customer",
      priority: "MEDIUM",
      description: `Inactive for ${INACTIVE_DAYS}+ days. Lifetime spend: £${Number(customer.totalSpend).toFixed(2)}`,
      action: "Send win-back offer or personal follow-up",
      metadata: { customerId: customer.id },
    });
  }

  return opportunities.sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[a.priority] - order[b.priority];
  });
}

export async function generateOpportunityRecommendations(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const opportunities = await detectSalesOpportunities(ownerId);
  let created = 0;

  for (const item of opportunities.slice(0, 5)) {
    await createSalesRecommendation(businessId, {
      customerId: item.type === "customer" ? item.id : undefined,
      title: item.title,
      description: item.description,
      action: item.action,
      priority: item.priority,
      expectedImpact: item.type === "opportunity" ? "Close deal" : "Recover revenue",
      metadata: item.metadata,
    });
    created += 1;
  }

  const analytics = await getCustomerAnalytics(businessId);
  const top = analytics.topSpendingCustomers[0];
  if (top) {
    await createSalesInsight(businessId, {
      title: "Top customer opportunity",
      description: `${top.name} is your highest spending customer at £${(top.totalSpentPence / 100).toFixed(2)}.`,
      category: "customers",
      priority: "HIGH",
      recommendation: "Offer loyalty rewards or premium upsell to retain top customer.",
      metadata: { customerId: top.id },
    });
    created += 1;
  }

  return created;
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
