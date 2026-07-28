import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeKnowledgeCollection,
  serializeKnowledgeDashboard,
  serializeKnowledgeDocument,
  serializeKnowledgeSearchAudit,
} from "@/modules/ai-knowledge/utils/ai-knowledge-utils";
import {
  getKnowledgeDashboard,
  listKnowledgeCollections,
  listKnowledgeConnectors,
  listKnowledgeDocuments,
  listKnowledgeSearchAudits,
  retrieveKnowledge,
} from "@/services/ai-knowledge.service";

export const getAiKnowledgeOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_KNOWLEDGE_VIEW });
  const [dashboard, recentSearches] = await Promise.all([
    getKnowledgeDashboard(context.business.id),
    listKnowledgeSearchAudits(context.business.id, 10),
  ]);

  return {
    context,
    dashboard: serializeKnowledgeDashboard(dashboard),
    recentSearches: recentSearches.map(serializeKnowledgeSearchAudit),
  };
});

export const getAiKnowledgeCollectionsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_KNOWLEDGE_VIEW });
  const collections = await listKnowledgeCollections(context.business.id);

  return {
    context,
    collections: collections.map(serializeKnowledgeCollection),
  };
});

export const getAiKnowledgeDocumentsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_KNOWLEDGE_VIEW });
  const documents = await listKnowledgeDocuments(context.business.id);

  return {
    context,
    documents: documents.map(serializeKnowledgeDocument),
  };
});

export const getAiKnowledgeAuditContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_KNOWLEDGE_VIEW });
  const audits = await listKnowledgeSearchAudits(context.business.id, 100);

  return {
    context,
    audits: audits.map(serializeKnowledgeSearchAudit),
  };
});

export const getAiKnowledgeConnectorsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_KNOWLEDGE_VIEW });
  const connectors = await listKnowledgeConnectors(context.business.id);

  return {
    context,
    connectors,
  };
});

export const getAiKnowledgeSearchContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_KNOWLEDGE_VIEW });

  return { context };
});

export async function previewKnowledgeSearch(query: string) {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_KNOWLEDGE_VIEW });
  return retrieveKnowledge(context, query, { limit: 5, agentId: "dashboard-preview" });
}
