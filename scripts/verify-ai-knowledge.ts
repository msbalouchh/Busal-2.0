import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import {
  ALL_PERMISSION_CODES,
  PERMISSION_CODES,
} from "../src/modules/authorization/constants/permissions";
import { AI_KNOWLEDGE_ROUTES } from "../src/modules/ai-knowledge/constants/routes";
import { KNOWLEDGE_CONNECTOR_DEFINITIONS } from "../src/modules/ai-knowledge/constants/connectors";
import { KNOWLEDGE_SOURCE_TYPE_LABELS } from "../src/modules/ai-knowledge/constants/routes";
import { splitTextIntoChunks } from "../src/modules/ai-knowledge/engine/chunking";
import { extractDocumentText } from "../src/modules/ai-knowledge/engine/document-processor";
import { ensureBootstrapKnowledgeTools } from "../src/modules/ai-knowledge/plugins/knowledge-tools";
import { listRegisteredTools } from "../src/modules/ai-tools/registry/tool-registry";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  createKnowledgeCollection,
  ensureDefaultKnowledgeCollection,
  getKnowledgeDashboard,
  listKnowledgeSearchAudits,
  retrieveKnowledge,
  uploadKnowledgeDocument,
} from "../src/services/ai-knowledge.service";
import { ensureAiToolsRegistered, executeAiTool } from "../src/services/ai-tools.service";
import { mapProfileToAuthUser } from "../src/services/user.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function buildPlatformContext(businessId: string): Promise<BusinessContext> {
  const businessRecord = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: true },
  });

  assert(businessRecord?.owner, "Business owner missing");

  const business = await getOwnedBusinessById(businessRecord.ownerId, businessId);
  assert(business, "Business profile missing");

  const user = mapProfileToAuthUser(
    businessRecord.owner.id,
    businessRecord.owner.email,
    businessRecord.owner,
    {},
  );
  const authorization = await resolveAuthorizationContext(user, business);

  return {
    user,
    business,
    branch: null,
    branchId: null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [
      { id: business.id, name: business.businessName ?? "Business", isOnboarded: true },
    ],
    accessibleBranches: [],
  };
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/ai-knowledge/index.ts",
    "src/modules/ai-knowledge/constants/routes.ts",
    "src/modules/ai-knowledge/constants/connectors.ts",
    "src/modules/ai-knowledge/types/knowledge-types.ts",
    "src/modules/ai-knowledge/engine/document-processor.ts",
    "src/modules/ai-knowledge/engine/chunking.ts",
    "src/modules/ai-knowledge/engine/embedding-client.ts",
    "src/modules/ai-knowledge/engine/vector-search.ts",
    "src/modules/ai-knowledge/engine/retrieval-engine.ts",
    "src/modules/ai-knowledge/plugins/knowledge-tools.ts",
    "src/modules/ai-knowledge/utils/ai-knowledge-utils.ts",
    "src/modules/ai-knowledge/lib/get-ai-knowledge-context.ts",
    "src/modules/ai-knowledge/actions/ai-knowledge-actions.ts",
    "src/modules/ai-knowledge/components/ai-knowledge-dashboard.tsx",
    "src/modules/ai-knowledge/components/ai-knowledge-lists.tsx",
    "src/modules/ai-knowledge/components/ai-knowledge-nav.tsx",
    "src/modules/ai-knowledge/components/ai-knowledge-search-panel.tsx",
    "src/services/ai-knowledge.service.ts",
    "src/app/dashboard/ai-knowledge/page.tsx",
    "src/app/dashboard/ai-knowledge/collections/page.tsx",
    "src/app/dashboard/ai-knowledge/documents/page.tsx",
    "src/app/dashboard/ai-knowledge/search/page.tsx",
    "src/app/dashboard/ai-knowledge/audit/page.tsx",
    "src/app/dashboard/ai-knowledge/connectors/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Knowledge routes");
  assert(AI_KNOWLEDGE_ROUTES.overview === "/dashboard/ai-knowledge", "route mismatch");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/ai-knowledge/lib/get-ai-knowledge-context.ts"),
    "utf8",
  );
  const actionsSource = readFileSync(
    join(root, "src/modules/ai-knowledge/actions/ai-knowledge-actions.ts"),
    "utf8",
  );
  const retrievalSource = readFileSync(
    join(root, "src/modules/ai-knowledge/engine/retrieval-engine.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "pages should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.AI_KNOWLEDGE_VIEW"), "view permission required");
  assert(
    actionsSource.includes("PERMISSION_CODES.AI_KNOWLEDGE_UPLOAD"),
    "upload permission required",
  );
  assert(
    retrievalSource.includes("retrieveKnowledgeThroughEngine"),
    "central retrieval engine required",
  );
  assert(PERMISSION_CODES.AI_KNOWLEDGE_ADMIN === "ai.knowledge.admin", "admin permission missing");
  assert(ALL_PERMISSION_CODES.includes("ai.knowledge.view"), "permission catalog missing");
  console.log("  PASS");

  console.log("Schema");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("model KnowledgeCollection"), "KnowledgeCollection missing");
  assert(schemaSource.includes("model KnowledgeChunk"), "KnowledgeChunk missing");
  assert(schemaSource.includes("model KnowledgeSearchAudit"), "KnowledgeSearchAudit missing");
  assert(schemaSource.includes("model KnowledgeConnector"), "KnowledgeConnector missing");
  console.log("  PASS");

  console.log("Knowledge source types");
  assert(Object.keys(KNOWLEDGE_SOURCE_TYPE_LABELS).length === 10, "expected 10 source types");
  console.log("  PASS");

  console.log("Connector architecture");
  assert(
    KNOWLEDGE_CONNECTOR_DEFINITIONS.GOOGLE_DRIVE.integrationReady === false,
    "google drive planned",
  );
  assert(
    KNOWLEDGE_CONNECTOR_DEFINITIONS.MANUAL.integrationReady === true,
    "manual connector ready",
  );
  console.log("  PASS");

  console.log("Document processing");
  const markdown = extractDocumentText("MARKDOWN", "# Refund Policy\n\nRefunds within 14 days.");
  const chunks = splitTextIntoChunks(markdown);
  assert(markdown.includes("Refund Policy"), "markdown extraction failed");
  assert(chunks.length >= 1, "chunking failed");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ select: { id: true } });
  assert(business, "No business found");

  const platform = await buildPlatformContext(business.id);
  assert(
    platform.permissions.includes(PERMISSION_CODES.AI_KNOWLEDGE_VIEW),
    "owner missing view permission",
  );

  console.log("Default collection");
  const collection = await ensureDefaultKnowledgeCollection(business.id, null);
  assert(collection.id, "default collection missing");
  console.log("  PASS");

  console.log("Upload and version document");
  const suffix = Date.now().toString();
  const upload = await uploadKnowledgeDocument(platform, {
    collectionId: collection.id,
    sourceType: "FAQ",
    title: `Refund FAQ ${suffix}`,
    format: "MARKDOWN",
    content: `# Refund FAQ ${suffix}\n\nCustomers can request refunds within 14 days of purchase.`,
    fileName: `refund-faq-${suffix}.md`,
    publish: true,
  });
  assert(upload.chunkCount >= 1, "document chunks missing");

  const version = await prisma.knowledgeDocumentVersion.findUnique({
    where: { id: upload.versionId },
  });
  assert(version?.status === "PUBLISHED", "published version missing");
  assert(version.authorUserId === platform.user.id, "author missing");
  console.log("  PASS");

  console.log("Semantic retrieval with citations");
  const retrieval = await retrieveKnowledge(platform, `refund policy ${suffix}`, {
    limit: 3,
    agentId: "verify-knowledge-agent",
  });
  assert(retrieval.citations.length >= 1, "retrieval citations missing");
  assert(retrieval.context.length > 0, "context not built");
  assert(retrieval.confidenceScore > 0, "confidence score missing");
  console.log("  PASS");

  console.log("Business isolation enforced in engine");
  const engineSource = readFileSync(join(root, "src/services/ai-knowledge.service.ts"), "utf8");
  assert(engineSource.includes("businessId: input.businessId"), "business isolation missing");
  assert(engineSource.includes("branchId"), "branch isolation missing");
  console.log("  PASS");

  console.log("Knowledge audit trail");
  const audits = await listKnowledgeSearchAudits(business.id, 5);
  assert(
    audits.some((audit) => audit.query.includes("refund policy")),
    "search audit missing",
  );
  console.log("  PASS");

  console.log("Dashboard metrics");
  const dashboard = await getKnowledgeDashboard(business.id);
  assert(dashboard.documentCount >= 1, "dashboard document count missing");
  assert(dashboard.searchCount >= 1, "dashboard search count missing");
  console.log("  PASS");

  console.log("AI tool integration");
  ensureBootstrapKnowledgeTools();
  await ensureAiToolsRegistered(business.id);
  assert(
    listRegisteredTools().some((tool) => tool.toolId === "knowledge.search"),
    "knowledge.search tool missing",
  );
  assert(
    listRegisteredTools().some((tool) => tool.toolId === "knowledge.build_context"),
    "knowledge.build_context tool missing",
  );

  const toolResult = await executeAiTool(platform, {
    toolId: "knowledge.search",
    input: { query: `refund policy ${suffix}`, limit: 3, agentId: "verify-tool-agent" },
    agentId: "verify-tool-agent",
  });
  assert(toolResult.status === "SUCCESS", "knowledge tool execution failed");
  console.log("  PASS");

  console.log("Centralized retrieval only");
  assert(
    !readFileSync(
      join(root, "src/modules/ai-knowledge/plugins/knowledge-tools.ts"),
      "utf8",
    ).includes("semanticVectorSearch"),
    "tools must not implement retrieval directly",
  );
  console.log("  PASS");

  console.log("Create scoped collection");
  const scoped = await createKnowledgeCollection(platform, {
    name: `Ops SOPs ${suffix}`,
    module: "staff",
    department: "operations",
    language: "en",
  });
  assert(scoped.module === "staff", "module scoping failed");
  console.log("  PASS");

  console.log("\nAI Knowledge Engine verification passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
