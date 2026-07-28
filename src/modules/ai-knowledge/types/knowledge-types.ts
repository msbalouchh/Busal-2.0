import type {
  KnowledgeConnectorType,
  KnowledgeDocumentFormat,
  KnowledgeSourceType,
} from "@prisma/client";

export interface KnowledgeCitation {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  versionNumber: number;
  sourceType: KnowledgeSourceType;
  collectionId: string;
  collectionName: string;
  content: string;
  score: number;
  metadata: Record<string, unknown> | null;
}

export interface KnowledgeRetrievalResult {
  query: string;
  citations: KnowledgeCitation[];
  context: string;
  confidenceScore: number;
  auditId: string;
}

export interface KnowledgeRetrievalOptions {
  collectionIds?: string[];
  branchId?: string | null;
  module?: string | null;
  language?: string | null;
  sourceTypes?: KnowledgeSourceType[];
  limit?: number;
  agentId?: string | null;
  minScore?: number;
}

export interface UploadKnowledgeDocumentInput {
  collectionId: string;
  sourceType: KnowledgeSourceType;
  title: string;
  format: KnowledgeDocumentFormat;
  content: string;
  fileName?: string | null;
  revisionNote?: string | null;
  metadata?: Record<string, unknown>;
  publish?: boolean;
}

export interface KnowledgeCollectionInput {
  name: string;
  description?: string | null;
  branchId?: string | null;
  department?: string | null;
  industry?: string | null;
  module?: string | null;
  language?: string;
}

export interface KnowledgeConnectorDefinition {
  connectorType: KnowledgeConnectorType;
  label: string;
  integrationReady: boolean;
}
