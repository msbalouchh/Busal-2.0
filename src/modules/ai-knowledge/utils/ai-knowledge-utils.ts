import type {
  KnowledgeCollection,
  KnowledgeDocument,
  KnowledgeDocumentVersion,
  KnowledgeSearchAudit,
  KnowledgeSource,
} from "@prisma/client";

export interface KnowledgeDashboardView {
  collectionCount: number;
  documentCount: number;
  publishedVersions: number;
  searchCount: number;
  connectorCount: number;
}

export interface KnowledgeCollectionView {
  id: string;
  name: string;
  description: string | null;
  branchId: string | null;
  department: string | null;
  industry: string | null;
  module: string | null;
  language: string;
  isActive: boolean;
  sourceCount: number;
  documentCount: number;
}

export interface KnowledgeDocumentView {
  id: string;
  title: string;
  collectionId: string;
  collectionName: string;
  sourceType: string;
  currentVersionNumber: number | null;
  status: string | null;
  format: string | null;
  publishedAt: string | null;
  authorUserId: string | null;
}

export interface KnowledgeSearchAuditView {
  id: string;
  query: string;
  resultCount: number;
  confidenceScore: number | null;
  responseQuality: number | null;
  agentId: string | null;
  createdAt: string;
}

export function serializeKnowledgeDashboard(input: KnowledgeDashboardView): KnowledgeDashboardView {
  return input;
}

export function serializeKnowledgeCollection(
  collection: KnowledgeCollection & {
    _count?: { sources: number; documents: number };
  },
): KnowledgeCollectionView {
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    branchId: collection.branchId,
    department: collection.department,
    industry: collection.industry,
    module: collection.module,
    language: collection.language,
    isActive: collection.isActive,
    sourceCount: collection._count?.sources ?? 0,
    documentCount: collection._count?.documents ?? 0,
  };
}

export function serializeKnowledgeDocument(
  document: KnowledgeDocument & {
    collection: { name: string };
    source: { sourceType: string };
    currentVersion: KnowledgeDocumentVersion | null;
  },
): KnowledgeDocumentView {
  return {
    id: document.id,
    title: document.title,
    collectionId: document.collectionId,
    collectionName: document.collection.name,
    sourceType: document.source.sourceType,
    currentVersionNumber: document.currentVersion?.versionNumber ?? null,
    status: document.currentVersion?.status ?? null,
    format: document.currentVersion?.format ?? null,
    publishedAt: document.currentVersion?.publishedAt?.toISOString() ?? null,
    authorUserId: document.currentVersion?.authorUserId ?? null,
  };
}

export function serializeKnowledgeSearchAudit(
  audit: KnowledgeSearchAudit,
): KnowledgeSearchAuditView {
  return {
    id: audit.id,
    query: audit.query,
    resultCount: audit.resultCount,
    confidenceScore: audit.confidenceScore,
    responseQuality: audit.responseQuality,
    agentId: audit.agentId,
    createdAt: audit.createdAt.toISOString(),
  };
}

export function serializeKnowledgeSource(source: KnowledgeSource) {
  return {
    id: source.id,
    collectionId: source.collectionId,
    sourceType: source.sourceType,
    title: source.title,
    description: source.description,
    connectorType: source.connectorType,
    isActive: source.isActive,
  };
}

export function serializeKnowledgeVersion(version: KnowledgeDocumentVersion) {
  return {
    id: version.id,
    documentId: version.documentId,
    versionNumber: version.versionNumber,
    format: version.format,
    status: version.status,
    authorUserId: version.authorUserId,
    authorStaffId: version.authorStaffId,
    publishedAt: version.publishedAt?.toISOString() ?? null,
    archivedAt: version.archivedAt?.toISOString() ?? null,
    revisionNote: version.revisionNote,
    fileName: version.fileName,
  };
}
