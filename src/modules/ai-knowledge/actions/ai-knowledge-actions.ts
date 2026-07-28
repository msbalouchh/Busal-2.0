"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { AI_KNOWLEDGE_ROUTES } from "@/modules/ai-knowledge/constants/routes";
import type { UploadKnowledgeDocumentInput } from "@/modules/ai-knowledge/types/knowledge-types";
import {
  archiveKnowledgeDocument,
  createKnowledgeCollection,
  publishKnowledgeDocumentVersion,
  retrieveKnowledge,
  uploadKnowledgeDocument,
} from "@/services/ai-knowledge.service";

function revalidateKnowledgePaths() {
  Object.values(AI_KNOWLEDGE_ROUTES).forEach((path) => {
    revalidatePath(path);
  });
}

export async function createKnowledgeCollectionAction(input: {
  name: string;
  description?: string | null;
  branchId?: string | null;
  department?: string | null;
  industry?: string | null;
  module?: string | null;
  language?: string;
}) {
  return protectedAction(PERMISSION_CODES.AI_KNOWLEDGE_UPLOAD, async ({ platform }) => {
    const collection = await createKnowledgeCollection(platform, input);
    revalidateKnowledgePaths();
    return { success: true as const, collectionId: collection.id };
  });
}

export async function uploadKnowledgeDocumentAction(input: UploadKnowledgeDocumentInput) {
  return protectedAction(PERMISSION_CODES.AI_KNOWLEDGE_UPLOAD, async ({ platform }) => {
    const result = await uploadKnowledgeDocument(platform, input);
    revalidateKnowledgePaths();
    return { success: true as const, result };
  });
}

export async function searchKnowledgeAction(query: string, limit = 5) {
  return protectedAction(PERMISSION_CODES.AI_KNOWLEDGE_VIEW, async ({ platform }) => {
    const result = await retrieveKnowledge(platform, query, {
      limit,
      agentId: "dashboard-search",
    });
    revalidateKnowledgePaths();
    return { success: true as const, result };
  });
}

export async function publishKnowledgeDocumentAction(documentId: string, versionId: string) {
  return protectedAction(PERMISSION_CODES.AI_KNOWLEDGE_EDIT, async ({ platform }) => {
    await publishKnowledgeDocumentVersion(platform, documentId, versionId);
    revalidateKnowledgePaths();
    return { success: true as const };
  });
}

export async function archiveKnowledgeDocumentAction(documentId: string) {
  return protectedAction(PERMISSION_CODES.AI_KNOWLEDGE_DELETE, async ({ platform }) => {
    await archiveKnowledgeDocument(platform, documentId);
    revalidateKnowledgePaths();
    return { success: true as const };
  });
}
