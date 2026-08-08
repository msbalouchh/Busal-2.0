import "server-only";

/** Orchestrates domain AI inference via delegated services. */


import type {
  KnowledgeConnectorType,
  KnowledgeDocumentFormat,
  KnowledgeSourceType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { KNOWLEDGE_CONNECTOR_DEFINITIONS } from "@/modules/ai-knowledge/constants/connectors";
import { splitTextIntoChunks } from "@/modules/ai-knowledge/engine/chunking";
import { createEmbedding } from "@/modules/ai-knowledge/engine/embedding-client";
import { extractDocumentText, hashContent } from "@/modules/ai-knowledge/engine/document-processor";
import { retrieveKnowledgeThroughEngine } from "@/modules/ai-knowledge/engine/retrieval-engine";
import type {
  KnowledgeCollectionInput,
  KnowledgeRetrievalOptions,
  KnowledgeRetrievalResult,
  UploadKnowledgeDocumentInput,
} from "@/modules/ai-knowledge/types/knowledge-types";

function assertPermission(platform: BusinessContext, permission: string): void {
  if (!platform.permissions.includes(permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

export async function ensureKnowledgeConnectors(businessId: string): Promise<void> {
  for (const connector of Object.values(KNOWLEDGE_CONNECTOR_DEFINITIONS)) {
    await prisma.knowledgeConnector.upsert({
      where: {
        businessId_connectorType: {
          businessId,
          connectorType: connector.connectorType,
        },
      },
      create: {
        businessId,
        connectorType: connector.connectorType,
        status: connector.integrationReady ? "ACTIVE" : "PLANNED",
        integrationReady: connector.integrationReady,
      },
      update: {
        integrationReady: connector.integrationReady,
      },
    });
  }
}

export async function createKnowledgeCollection(
  platform: BusinessContext,
  input: KnowledgeCollectionInput,
) {
  assertPermission(platform, PERMISSION_CODES.AI_KNOWLEDGE_UPLOAD);

  return prisma.knowledgeCollection.create({
    data: {
      businessId: platform.business.id,
      branchId: input.branchId ?? platform.branchId,
      name: input.name,
      description: input.description ?? null,
      department: input.department ?? null,
      industry: input.industry ?? platform.business.businessType,
      module: input.module ?? null,
      language: input.language ?? "en",
    },
  });
}

export async function listKnowledgeCollections(businessId: string) {
  return prisma.knowledgeCollection.findMany({
    where: { businessId, isActive: true },
    include: {
      _count: {
        select: {
          sources: true,
          documents: true,
        },
      },
    },
    orderBy: [{ module: "asc" }, { name: "asc" }],
  });
}

export async function listKnowledgeDocuments(businessId: string) {
  return prisma.knowledgeDocument.findMany({
    where: { businessId },
    include: {
      collection: { select: { name: true } },
      source: { select: { sourceType: true } },
      currentVersion: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listKnowledgeDocumentVersions(documentId: string, businessId: string) {
  return prisma.knowledgeDocumentVersion.findMany({
    where: { documentId, businessId },
    orderBy: { versionNumber: "desc" },
  });
}

export async function listKnowledgeSearchAudits(businessId: string, limit = 50) {
  return prisma.knowledgeSearchAudit.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listKnowledgeConnectors(businessId: string) {
  await ensureKnowledgeConnectors(businessId);

  return prisma.knowledgeConnector.findMany({
    where: { businessId },
    orderBy: { connectorType: "asc" },
  });
}

export async function getKnowledgeDashboard(businessId: string) {
  await ensureKnowledgeConnectors(businessId);

  const [collectionCount, documentCount, publishedVersions, searchCount, connectorCount] =
    await Promise.all([
      prisma.knowledgeCollection.count({ where: { businessId, isActive: true } }),
      prisma.knowledgeDocument.count({ where: { businessId } }),
      prisma.knowledgeDocumentVersion.count({
        where: { businessId, status: "PUBLISHED" },
      }),
      prisma.knowledgeSearchAudit.count({ where: { businessId } }),
      prisma.knowledgeConnector.count({ where: { businessId } }),
    ]);

  return {
    collectionCount,
    documentCount,
    publishedVersions,
    searchCount,
    connectorCount,
  };
}

async function processDocumentVersion(
  businessId: string,
  branchId: string | null,
  versionId: string,
  format: KnowledgeDocumentFormat,
  rawContent: string,
  metadata?: Record<string, unknown>,
): Promise<number> {
  const extracted = extractDocumentText(format, rawContent);
  const chunks = splitTextIntoChunks(extracted);

  await prisma.knowledgeChunk.deleteMany({
    where: { documentVersionId: versionId },
  });

  for (const chunk of chunks) {
    const embedding = await createEmbedding(chunk.content);

    await prisma.knowledgeChunk.create({
      data: {
        businessId,
        branchId,
        documentVersionId: versionId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
        embedding,
      },
    });
  }

  return chunks.length;
}

export async function uploadKnowledgeDocument(
  platform: BusinessContext,
  input: UploadKnowledgeDocumentInput,
) {
  assertPermission(platform, PERMISSION_CODES.AI_KNOWLEDGE_UPLOAD);

  const collection = await prisma.knowledgeCollection.findFirst({
    where: {
      id: input.collectionId,
      businessId: platform.business.id,
      isActive: true,
    },
  });

  if (!collection) {
    throw new Error("Knowledge collection not found");
  }

  const extracted = extractDocumentText(input.format, input.content);
  const contentHash = hashContent(extracted);

  const source = await prisma.knowledgeSource.create({
    data: {
      businessId: platform.business.id,
      collectionId: collection.id,
      sourceType: input.sourceType,
      title: input.title,
      connectorType: "MANUAL",
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  const document = await prisma.knowledgeDocument.create({
    data: {
      businessId: platform.business.id,
      collectionId: collection.id,
      sourceId: source.id,
      title: input.title,
    },
  });

  const version = await prisma.knowledgeDocumentVersion.create({
    data: {
      documentId: document.id,
      businessId: platform.business.id,
      versionNumber: 1,
      format: input.format,
      status: input.publish === false ? "DRAFT" : "PROCESSING",
      authorUserId: platform.user.id,
      authorStaffId: platform.staffSession?.staffId ?? null,
      fileName: input.fileName ?? null,
      rawContent: input.content,
      contentHash,
      revisionNote: input.revisionNote ?? "Initial version",
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  const chunkCount = await processDocumentVersion(
    platform.business.id,
    collection.branchId ?? platform.branchId,
    version.id,
    input.format,
    input.content,
    input.metadata,
  );

  const publishedVersion = await prisma.knowledgeDocumentVersion.update({
    where: { id: version.id },
    data: {
      status: input.publish === false ? "DRAFT" : "PUBLISHED",
      publishedAt: input.publish === false ? null : new Date(),
      metadata: {
        ...(input.metadata ?? {}),
        chunkCount,
      } as Prisma.InputJsonValue,
    },
  });

  await prisma.knowledgeDocument.update({
    where: { id: document.id },
    data: { currentVersionId: publishedVersion.id },
  });

  return {
    documentId: document.id,
    versionId: publishedVersion.id,
    chunkCount,
  };
}

export async function publishKnowledgeDocumentVersion(
  platform: BusinessContext,
  documentId: string,
  versionId: string,
) {
  assertPermission(platform, PERMISSION_CODES.AI_KNOWLEDGE_EDIT);

  const version = await prisma.knowledgeDocumentVersion.findFirst({
    where: {
      id: versionId,
      documentId,
      businessId: platform.business.id,
    },
  });

  if (!version) {
    throw new Error("Document version not found");
  }

  const published = await prisma.knowledgeDocumentVersion.update({
    where: { id: version.id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      archivedAt: null,
    },
  });

  await prisma.knowledgeDocument.update({
    where: { id: documentId },
    data: { currentVersionId: published.id },
  });

  return published;
}

export async function archiveKnowledgeDocument(platform: BusinessContext, documentId: string) {
  assertPermission(platform, PERMISSION_CODES.AI_KNOWLEDGE_DELETE);

  const document = await prisma.knowledgeDocument.findFirst({
    where: { id: documentId, businessId: platform.business.id },
    include: { currentVersion: true },
  });

  if (!document?.currentVersion) {
    throw new Error("Document not found");
  }

  await prisma.knowledgeDocumentVersion.update({
    where: { id: document.currentVersion.id },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
    },
  });
}

export async function retrieveKnowledge(
  platform: BusinessContext,
  query: string,
  options: KnowledgeRetrievalOptions = {},
): Promise<KnowledgeRetrievalResult> {
  assertPermission(platform, PERMISSION_CODES.AI_KNOWLEDGE_VIEW);

  return retrieveKnowledgeThroughEngine(platform, query, options, {
    loadCandidates: async (input) => {
      const collections = await prisma.knowledgeCollection.findMany({
        where: {
          businessId: input.businessId,
          isActive: true,
          ...(input.collectionIds && input.collectionIds.length > 0
            ? { id: { in: input.collectionIds } }
            : {}),
          ...(input.module ? { module: input.module } : {}),
          ...(input.language ? { language: input.language } : {}),
          ...(input.branchId
            ? {
                OR: [{ branchId: null }, { branchId: input.branchId }],
              }
            : {}),
        },
        select: { id: true },
      });

      const collectionIds = collections.map((collection) => collection.id);
      if (collectionIds.length === 0) {
        return [];
      }

      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          businessId: input.businessId,
          ...(input.branchId
            ? {
                OR: [{ branchId: null }, { branchId: input.branchId }],
              }
            : {}),
          documentVersion: {
            status: "PUBLISHED",
            document: {
              collectionId: { in: collectionIds },
              ...(input.sourceTypes && input.sourceTypes.length > 0
                ? { source: { sourceType: { in: input.sourceTypes } } }
                : {}),
            },
          },
        },
        include: {
          documentVersion: {
            include: {
              document: {
                include: {
                  collection: true,
                  source: true,
                },
              },
            },
          },
        },
      });

      return chunks.map((chunk) => ({
        id: chunk.id,
        content: chunk.content,
        embedding: chunk.embedding,
        metadata: (chunk.metadata as Record<string, unknown> | null) ?? null,
        documentId: chunk.documentVersion.document.id,
        documentTitle: chunk.documentVersion.document.title,
        versionNumber: chunk.documentVersion.versionNumber,
        collectionId: chunk.documentVersion.document.collection.id,
        collectionName: chunk.documentVersion.document.collection.name,
        sourceType: chunk.documentVersion.document.source.sourceType,
      }));
    },
    writeAudit: async (input) => {
      const audit = await prisma.knowledgeSearchAudit.create({
        data: {
          businessId: input.businessId,
          branchId: input.branchId,
          userId: input.userId,
          staffId: input.staffId,
          agentId: input.agentId,
          query: input.query,
          collectionIds: input.collectionIds,
          retrievedChunkIds: input.citations.map((citation) => citation.chunkId),
          retrievedDocumentIds: [
            ...new Set(input.citations.map((citation) => citation.documentId)),
          ],
          resultCount: input.citations.length,
          confidenceScore: input.confidenceScore,
          metadata: {
            citationScores: input.citations.map((citation) => ({
              chunkId: citation.chunkId,
              score: citation.score,
            })),
          },
        },
      });

      return { id: audit.id };
    },
  });
}

export async function buildKnowledgeContextForAgent(
  platform: BusinessContext,
  query: string,
  options: KnowledgeRetrievalOptions = {},
): Promise<KnowledgeRetrievalResult> {
  return retrieveKnowledge(platform, query, options);
}

export async function recordKnowledgeResponseQuality(
  platform: BusinessContext,
  auditId: string,
  responseQuality: number,
) {
  assertPermission(platform, PERMISSION_CODES.AI_KNOWLEDGE_ADMIN);

  await prisma.knowledgeSearchAudit.updateMany({
    where: {
      id: auditId,
      businessId: platform.business.id,
    },
    data: {
      responseQuality,
    },
  });
}

export async function ensureDefaultKnowledgeCollection(
  businessId: string,
  branchId: string | null,
) {
  const existing = await prisma.knowledgeCollection.findFirst({
    where: {
      businessId,
      name: "General Knowledge",
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.knowledgeCollection.create({
    data: {
      businessId,
      branchId,
      name: "General Knowledge",
      description: "Default business knowledge collection",
      module: "ai",
      language: "en",
    },
  });
}

export type { KnowledgeConnectorType, KnowledgeSourceType, KnowledgeDocumentFormat };
