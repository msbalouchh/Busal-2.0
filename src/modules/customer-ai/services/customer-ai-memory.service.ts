import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { aiMemoryManager } from "@/modules/ai-engine/managers/memory-manager";
import {
  buildBusinessContextByBusinessId,
  buildConversationContextByBusinessId,
} from "@/services/ai-memory-context-builder.service";
import { retrieveMemoriesByBusinessId } from "@/services/ai-memory-retrieval.service";
import { summarizeMemoryCollection } from "@/services/ai-memory-summarizer.service";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface BusinessContextSnapshot {
  hours: Array<{ day: string; open: string | null; close: string | null; closed: boolean }>;
  branches: Array<{ id: string; name: string; isMain: boolean; address: string | null }>;
  menuSummary: Array<{ id: string; name: string; pricePence: number | null; category: string | null }>;
  businessInfo: Record<string, unknown>;
  memorySummary: string;
  structuredFacts: string;
}

/** Loads structured business context for customer AI without dumping full DB. */
export async function loadBusinessContextSnapshot(
  businessId: string,
  options: { branchId?: string | null; query?: string } = {},
): Promise<BusinessContextSnapshot> {
  const [business, hours, branches, menuItems, agentMemory, aiMemories] = await Promise.all([
    prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: {
        businessName: true,
        industry: true,
        businessType: true,
        phone: true,
        businessEmail: true,
        timezone: true,
        currency: true,
        country: true,
        aiName: true,
        aiPersonality: true,
      },
    }),
    prisma.businessHours.findMany({
      where: { businessId, branchId: options.branchId ?? null },
      orderBy: { dayOfWeek: "asc" },
    }),
    prisma.branch.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true, isMain: true, address: true, addressLine1: true },
      take: 20,
    }),
    prisma.product.findMany({
      where: { businessId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        price: true,
        category: { select: { name: true } },
      },
      orderBy: { name: "asc" },
      take: 40,
    }),
    aiMemoryManager.summarizeForContext(businessId),
    retrieveMemoriesByBusinessId(businessId, "BUSINESS", 8),
  ]);

  const memorySummary = await buildBusinessContextByBusinessId(businessId).catch(() => agentMemory);
  const structuredFacts = summarizeMemoryCollection(aiMemories, 6);

  const snapshot: BusinessContextSnapshot = {
    hours: hours.map((entry) => ({
      day: DAY_NAMES[entry.dayOfWeek] ?? `Day ${entry.dayOfWeek}`,
      open: entry.openTime,
      close: entry.closeTime,
      closed: entry.isClosed,
    })),
    branches: branches.map((b) => ({
      id: b.id,
      name: b.name,
      isMain: b.isMain,
      address: b.address ?? b.addressLine1 ?? null,
    })),
    menuSummary: menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      pricePence: Math.round(Number(item.price) * 100),
      category: item.category?.name ?? null,
    })),
    businessInfo: {
      name: business.businessName,
      industry: business.industry,
      type: business.businessType,
      phone: business.phone,
      email: business.businessEmail,
      timezone: business.timezone,
      currency: business.currency,
      country: business.country,
    },
    memorySummary,
    structuredFacts,
  };

  return snapshot;
}

/** Syncs key business facts into AIMemory for durable business recall. */
export async function syncBusinessFactsToMemory(businessId: string): Promise<number> {
  const snapshot = await loadBusinessContextSnapshot(businessId);
  let synced = 0;

  const facts: Array<{ title: string; content: string }> = [
    {
      title: "Business Information",
      content: JSON.stringify(snapshot.businessInfo),
    },
    {
      title: "Opening Hours",
      content: snapshot.hours
        .map((h) => (h.closed ? `${h.day}: Closed` : `${h.day}: ${h.open} - ${h.close}`))
        .join("\n"),
    },
    {
      title: "Locations",
      content: snapshot.branches
        .map((b) => `${b.name}${b.isMain ? " (Main)" : ""}${b.address ? `: ${b.address}` : ""}`)
        .join("\n"),
    },
    {
      title: "Menu Catalog",
      content: snapshot.menuSummary
        .slice(0, 30)
        .map((m) =>
          m.pricePence != null
            ? `${m.name}${m.category ? ` (${m.category})` : ""}: £${(m.pricePence / 100).toFixed(2)}`
            : m.name,
        )
        .join("\n"),
    },
  ];

  for (const fact of facts) {
    if (!fact.content.trim()) continue;

    const existing = await prisma.aIMemory.findFirst({
      where: { businessId, memoryType: "BUSINESS", title: fact.title },
      select: { id: true },
    });

    const payload = {
      businessId,
      memoryType: "BUSINESS" as const,
      title: fact.title,
      content: fact.content,
      importanceScore: 0.9,
      metadata: { source: "auto-sync", syncedAt: new Date().toISOString() } as Prisma.InputJsonValue,
    };

    if (existing) {
      await prisma.aIMemory.update({
        where: { id: existing.id },
        data: { content: fact.content, metadata: payload.metadata },
      });
    } else {
      await prisma.aIMemory.create({ data: payload });
    }

    await aiMemoryManager.write({
      businessId,
      scope: "business",
      key: `fact:${fact.title.toLowerCase().replace(/\s+/g, "_")}`,
      content: fact.content.slice(0, 2000),
    });

    synced += 1;
  }

  return synced;
}

/** Syncs published knowledge documents (FAQs, policies, uploads) into business memory. */
export async function syncKnowledgeDocumentsToMemory(businessId: string): Promise<number> {
  const documents = await prisma.knowledgeDocument.findMany({
    where: { businessId },
    include: {
      currentVersion: {
        select: { rawContent: true, status: true, format: true },
      },
      collection: { select: { name: true } },
    },
    take: 50,
  });

  let synced = 0;

  for (const document of documents) {
    const content = document.currentVersion?.rawContent?.trim();
    if (!content || document.currentVersion?.status !== "PUBLISHED") continue;

    const title = `Knowledge: ${document.title}`;
    const existing = await prisma.aIMemory.findFirst({
      where: { businessId, memoryType: "BUSINESS", title },
      select: { id: true },
    });

    const payload = {
      businessId,
      memoryType: "BUSINESS" as const,
      title,
      content: content.slice(0, 8000),
      importanceScore: 0.85,
      metadata: {
        source: "knowledge-sync",
        collection: document.collection.name,
        documentId: document.id,
        syncedAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    };

    if (existing) {
      await prisma.aIMemory.update({
        where: { id: existing.id },
        data: { content: payload.content, metadata: payload.metadata },
      });
    } else {
      await prisma.aIMemory.create({ data: payload });
    }

    await aiMemoryManager.write({
      businessId,
      scope: "business",
      key: `knowledge:${document.id}`,
      content: content.slice(0, 2000),
    });

    synced += 1;
  }

  return synced;
}

export async function buildUnifiedMemoryContext(
  businessId: string,
  conversationId?: string,
): Promise<string> {
  const [businessMemory, conversationMemory, agentMemory] = await Promise.all([
    buildBusinessContextByBusinessId(businessId).catch(() => ""),
    conversationId
      ? buildConversationContextByBusinessId(businessId, conversationId).catch(() => "")
      : Promise.resolve(""),
    aiMemoryManager.summarizeForContext(businessId),
  ]);

  return [
    businessMemory && `## Business Memory\n${businessMemory}`,
    conversationMemory && `## Conversation Context\n${conversationMemory}`,
    agentMemory && `## Recent Activity\n${agentMemory}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Structured operational memory for AI business operations (orders, reservations, activity). */
export async function loadOperationsMemoryContext(businessId: string): Promise<string> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [recentOrders, upcomingReservations, recentActions, customerEvents] = await Promise.all([
    prisma.restaurantOrder.findMany({
      where: { businessId, placedAt: { gte: since } },
      orderBy: { placedAt: "desc" },
      take: 10,
      select: { orderNumber: true, status: true, placedAt: true, totalAmount: true },
    }).catch(() => []),
    prisma.reservation.findMany({
      where: { businessId, reservationDate: { gte: new Date() } },
      orderBy: { reservationDate: "asc" },
      take: 10,
      select: {
        reservationNumber: true,
        status: true,
        partySize: true,
        reservationDate: true,
        startTime: true,
      },
    }).catch(() => []),
    prisma.customerAiActionLog.findMany({
      where: { businessId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { toolId: true, success: true, audience: true, createdAt: true },
    }).catch(() => []),
    prisma.customerAiEvent.findMany({
      where: { businessId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { eventType: true, channel: true, createdAt: true },
    }).catch(() => []),
  ]);

  const sections: string[] = [];

  if (recentOrders.length > 0) {
    sections.push(
      `## Recent Orders\n${recentOrders
        .map(
          (o) =>
            `- ${o.orderNumber}: ${o.status} (${new Date(o.placedAt).toLocaleDateString()})`,
        )
        .join("\n")}`,
    );
  }

  if (upcomingReservations.length > 0) {
    sections.push(
      `## Upcoming Reservations\n${upcomingReservations
        .map(
          (r) =>
            `- ${r.reservationNumber}: party of ${r.partySize} on ${r.reservationDate.toISOString().slice(0, 10)} at ${r.startTime}`,
        )
        .join("\n")}`,
    );
  }

  if (recentActions.length > 0) {
    sections.push(
      `## Recent AI Actions\n${recentActions
        .map((a) => `- ${a.toolId} (${a.audience}): ${a.success ? "success" : "failed"}`)
        .join("\n")}`,
    );
  }

  if (customerEvents.length > 0) {
    sections.push(
      `## Customer AI Events\n${customerEvents
        .map((e) => `- ${e.eventType} via ${e.channel}`)
        .join("\n")}`,
    );
  }

  return sections.join("\n\n") || "No recent operational activity recorded.";
}
