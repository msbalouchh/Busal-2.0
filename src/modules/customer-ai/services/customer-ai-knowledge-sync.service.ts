import "server-only";

import {
  syncBusinessFactsToMemory,
  syncKnowledgeDocumentsToMemory,
} from "@/modules/customer-ai/services/customer-ai-memory.service";
import { listKnowledgeDocuments } from "@/services/ai-knowledge.service";

/** Syncs business operational data and published knowledge into AIMemory. */
export async function syncBusinessDataToKnowledge(businessId: string): Promise<{
  memoryFactsSynced: number;
  knowledgeDocumentsSynced: number;
  publishedDocumentCount: number;
}> {
  const [memoryFactsSynced, knowledgeDocumentsSynced, documents] = await Promise.all([
    syncBusinessFactsToMemory(businessId),
    syncKnowledgeDocumentsToMemory(businessId),
    listKnowledgeDocuments(businessId),
  ]);

  const publishedDocumentCount = documents.filter(
    (doc) => doc.currentVersion?.status === "PUBLISHED",
  ).length;

  return { memoryFactsSynced, knowledgeDocumentsSynced, publishedDocumentCount };
}

export async function getCustomerAiKnowledgeSummary(businessId: string): Promise<{
  publishedDocuments: number;
  totalDocuments: number;
  memoryFactTitles: string[];
}> {
  const [documents, memories] = await Promise.all([
    listKnowledgeDocuments(businessId),
    import("@/lib/prisma").then(({ prisma }) =>
      prisma.aIMemory.findMany({
        where: { businessId, memoryType: "BUSINESS" },
        select: { title: true },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
    ),
  ]);

  return {
    publishedDocuments: documents.filter((d) => d.currentVersion?.status === "PUBLISHED").length,
    totalDocuments: documents.length,
    memoryFactTitles: memories.map((m) => m.title),
  };
}
