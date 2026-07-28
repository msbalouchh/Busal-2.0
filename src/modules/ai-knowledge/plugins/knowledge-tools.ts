import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { registerTool } from "@/modules/ai-tools/registry/tool-registry";
import type { ToolContext } from "@/modules/ai-tools/types/tool-types";
import type { BusinessContext } from "@/modules/business-context/types/business-context";

const searchSchema = {
  type: "object",
  required: ["query"],
  properties: {
    query: { type: "string" },
    limit: { type: "number" },
    collectionIds: { type: "array", items: { type: "string" } },
    module: { type: "string" },
    language: { type: "string" },
    agentId: { type: "string" },
  },
} as const;

const contextSchema = {
  type: "object",
  required: ["query"],
  properties: {
    query: { type: "string" },
    limit: { type: "number" },
    agentId: { type: "string" },
  },
} as const;

function toBusinessContext(context: ToolContext): BusinessContext {
  const permissions = new Set(context.permissions);

  return {
    user: context.user,
    business: context.business,
    branch: context.branch,
    branchId: context.branchId,
    roleSlug: context.roleSlug,
    permissions: context.permissions,
    authorization: {
      user: context.user,
      business: context.business,
      permissions,
      roleSlug: context.roleSlug,
      isOwner: context.permissions.includes(PERMISSION_CODES.BUSINESS_UPDATE),
    },
    staffSession: null,
    isOwner: context.permissions.includes(PERMISSION_CODES.BUSINESS_UPDATE),
    accessibleBusinesses: [],
    accessibleBranches: [],
  };
}

export function registerKnowledgeAiTools(): void {
  registerTool(
    {
      toolId: "knowledge.search",
      name: "Search Knowledge",
      description: "Retrieve ranked business knowledge with citations via the Knowledge Engine.",
      module: "ai-knowledge",
      category: "AI",
      inputSchema: searchSchema,
      outputSchema: { type: "object" },
      requiredPermissions: [PERMISSION_CODES.AI_KNOWLEDGE_VIEW, PERMISSION_CODES.AI_TOOL_EXECUTE],
      riskLevel: "READ_ONLY",
      readOnly: true,
      dryRunSupported: true,
    },
    async (context, input) => {
      const { retrieveKnowledge } = await import("@/services/ai-knowledge.service");
      const query = typeof input.query === "string" ? input.query : "";
      const limit = typeof input.limit === "number" ? input.limit : 5;
      const collectionIds = Array.isArray(input.collectionIds)
        ? input.collectionIds.filter((value): value is string => typeof value === "string")
        : undefined;

      const result = await retrieveKnowledge(toBusinessContext(context), query, {
        limit,
        collectionIds,
        module: typeof input.module === "string" ? input.module : null,
        language: typeof input.language === "string" ? input.language : null,
        agentId: typeof input.agentId === "string" ? input.agentId : null,
      });

      return {
        query: result.query,
        confidenceScore: result.confidenceScore,
        auditId: result.auditId,
        citations: result.citations,
      };
    },
  );

  registerTool(
    {
      toolId: "knowledge.build_context",
      name: "Build Knowledge Context",
      description: "Build RAG context for AI agents from the centralized Knowledge Engine.",
      module: "ai-knowledge",
      category: "AI",
      inputSchema: contextSchema,
      outputSchema: { type: "object" },
      requiredPermissions: [PERMISSION_CODES.AI_KNOWLEDGE_VIEW, PERMISSION_CODES.AI_TOOL_EXECUTE],
      riskLevel: "READ_ONLY",
      readOnly: true,
      dryRunSupported: true,
    },
    async (context, input) => {
      const { buildKnowledgeContextForAgent } = await import("@/services/ai-knowledge.service");
      const query = typeof input.query === "string" ? input.query : "";
      const limit = typeof input.limit === "number" ? input.limit : 5;

      const result = await buildKnowledgeContextForAgent(toBusinessContext(context), query, {
        limit,
        agentId: typeof input.agentId === "string" ? input.agentId : null,
      });

      return {
        context: result.context,
        citationCount: result.citations.length,
        confidenceScore: result.confidenceScore,
        auditId: result.auditId,
      };
    },
  );
}

let bootstrapComplete = false;

export function ensureBootstrapKnowledgeTools(): void {
  if (bootstrapComplete) {
    return;
  }

  registerKnowledgeAiTools();
  bootstrapComplete = true;
}
