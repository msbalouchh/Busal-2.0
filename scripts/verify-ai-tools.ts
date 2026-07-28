import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import {
  ALL_PERMISSION_CODES,
  PERMISSION_CODES,
} from "../src/modules/authorization/constants/permissions";
import { AI_TOOLS_ROUTES } from "../src/modules/ai-tools/constants/routes";
import { AI_TOOL_CATEGORIES } from "../src/modules/ai-tools/constants/categories";
import { buildToolContext } from "../src/modules/ai-tools/engine/tool-context";
import { listRegisteredTools } from "../src/modules/ai-tools/registry/tool-registry";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import {
  disableAiTool,
  discoverAvailableAiTools,
  ensureAiToolsRegistered,
  executeAiTool,
  getAiToolsDashboard,
  listAiToolExecutions,
  listAiTools,
} from "../src/services/ai-tools.service";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
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
    "src/modules/ai-tools/index.ts",
    "src/modules/ai-tools/constants/routes.ts",
    "src/modules/ai-tools/constants/categories.ts",
    "src/modules/ai-tools/types/tool-types.ts",
    "src/modules/ai-tools/registry/tool-registry.ts",
    "src/modules/ai-tools/engine/tool-context.ts",
    "src/modules/ai-tools/engine/tool-input-validator.ts",
    "src/modules/ai-tools/engine/tool-safety.ts",
    "src/modules/ai-tools/engine/tool-retry.ts",
    "src/modules/ai-tools/engine/tool-discovery.ts",
    "src/modules/ai-tools/engine/tool-execution-engine.ts",
    "src/modules/ai-tools/plugins/bootstrap-tools.ts",
    "src/modules/ai-tools/utils/ai-tools-utils.ts",
    "src/modules/ai-tools/lib/get-ai-tools-context.ts",
    "src/modules/ai-tools/actions/ai-tools-actions.ts",
    "src/modules/ai-tools/components/ai-tools-dashboard.tsx",
    "src/modules/ai-tools/components/ai-tools-lists.tsx",
    "src/modules/ai-tools/components/ai-tools-nav.tsx",
    "src/services/ai-tools.service.ts",
    "src/app/dashboard/ai-tools/page.tsx",
    "src/app/dashboard/ai-tools/registry/page.tsx",
    "src/app/dashboard/ai-tools/executions/page.tsx",
    "src/app/dashboard/ai-tools/discovery/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("AI Tools routes");
  assert(AI_TOOLS_ROUTES.overview === "/dashboard/ai-tools", "ai tools route mismatch");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/ai-tools/lib/get-ai-tools-context.ts"),
    "utf8",
  );
  const actionsSource = readFileSync(
    join(root, "src/modules/ai-tools/actions/ai-tools-actions.ts"),
    "utf8",
  );
  const engineSource = readFileSync(
    join(root, "src/modules/ai-tools/engine/tool-execution-engine.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "pages should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.AI_TOOL_EXECUTE"), "ai.tool.execute required");
  assert(
    actionsSource.includes("PERMISSION_CODES.AI_TOOL_EXECUTE"),
    "execute action permission missing",
  );
  assert(
    actionsSource.includes("PERMISSION_CODES.AI_TOOL_DISABLE"),
    "disable action permission missing",
  );
  assert(engineSource.includes("buildToolContext"), "engine must inject tool context");
  assert(PERMISSION_CODES.AI_TOOL_ADMIN === "ai.tool.admin", "ai.tool.admin missing");
  assert(
    ALL_PERMISSION_CODES.includes("ai.tool.execute"),
    "permission catalog missing ai.tool.execute",
  );
  console.log("  PASS");

  console.log("Schema");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("model AiTool"), "AiTool missing");
  assert(schemaSource.includes("model AiToolExecution"), "AiToolExecution missing");
  assert(schemaSource.includes("enum AiToolCategory"), "AiToolCategory missing");
  console.log("  PASS");

  console.log("Tool categories");
  assert(AI_TOOL_CATEGORIES.length === 14, "expected 14 tool categories");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ select: { id: true } });
  assert(business, "No business found");

  const platform = await buildPlatformContext(business.id);
  assert(
    platform.permissions.includes(PERMISSION_CODES.AI_TOOL_EXECUTE),
    "owner missing ai.tool.execute",
  );

  console.log("Register bootstrap tools");
  await ensureAiToolsRegistered(business.id);
  const tools = await listAiTools(business.id);
  assert(tools.length >= 7, "bootstrap tools should be registered");
  assert(
    tools.some((tool) => tool.toolId === "crm.list_customers"),
    "crm tool missing",
  );
  console.log("  PASS");

  console.log("Tool discovery");
  const discovered = await discoverAvailableAiTools(platform);
  assert(
    discovered.some((tool) => tool.toolId === "crm.list_customers"),
    "crm tool not discovered",
  );
  assert(
    discovered.some((tool) => tool.toolId === "reporting.get_dashboard"),
    "reporting tool missing",
  );
  console.log("  PASS");

  console.log("Read-only tool execution");
  const readResult = await executeAiTool(platform, {
    toolId: "crm.list_customers",
    input: {},
    agentId: "verify-agent",
    modelUsed: "verify-model",
    tokensUsed: 12,
  });
  assert(readResult.status === "SUCCESS", "read-only execution failed");
  assert(readResult.output?.count != null, "read-only output missing");
  console.log("  PASS");

  console.log("Dry run mode");
  const dryRunResult = await executeAiTool(platform, {
    toolId: "admin.bulk_staff_removal",
    input: { staffIds: ["staff-1", "staff-2"] },
    dryRun: true,
    agentId: "verify-agent",
  });
  assert(dryRunResult.status === "DRY_RUN", "dry run should complete");
  assert(dryRunResult.dryRun === true, "dry run flag missing");
  console.log("  PASS");

  console.log("High-risk confirmation required");
  const blockedResult = await executeAiTool(platform, {
    toolId: "admin.delete_business",
    input: { confirmName: "Test Business" },
    confirmed: false,
    agentId: "verify-agent",
  });
  assert(blockedResult.status === "AWAITING_CONFIRMATION", "high-risk should require confirmation");
  assert(blockedResult.requiresConfirmation === true, "confirmation flag missing");
  console.log("  PASS");

  console.log("Confirmed high-risk execution");
  const confirmedResult = await executeAiTool(platform, {
    toolId: "commercial.bulk_price_update",
    input: { productIds: ["prod-1"], percentChange: 5 },
    confirmed: true,
    agentId: "verify-agent",
  });
  assert(confirmedResult.status === "SUCCESS", "confirmed high-risk execution failed");
  console.log("  PASS");

  console.log("Tool context injection");
  const toolContext = buildToolContext(platform, {
    currentModule: "crm",
    selectedRecord: { type: "customer", id: "cust-1" },
  });
  assert(toolContext.business.id === platform.business.id, "business context missing");
  assert(toolContext.user.id === platform.user.id, "user context missing");
  assert(toolContext.currentModule === "crm", "module context missing");
  assert(toolContext.selectedRecord?.id === "cust-1", "selected record missing");
  assert(toolContext.timezone, "timezone missing");
  console.log("  PASS");

  console.log("Disable tool");
  await disableAiTool(platform, "crm.list_customers");
  const afterDisable = await discoverAvailableAiTools(platform);
  assert(
    !afterDisable.some((tool) => tool.toolId === "crm.list_customers"),
    "disabled tool discovered",
  );
  console.log("  PASS");

  console.log("Execution history");
  const executions = await listAiToolExecutions(business.id, 20);
  assert(executions.length >= 4, "execution history missing entries");
  assert(
    executions.some((execution) => execution.toolId === "crm.list_customers"),
    "crm execution history missing",
  );
  assert(
    executions.some((execution) => execution.status === "AWAITING_CONFIRMATION"),
    "confirmation execution missing",
  );
  console.log("  PASS");

  console.log("Dashboard metrics");
  const dashboard = await getAiToolsDashboard(business.id);
  assert(dashboard.totalTools >= 7, "dashboard tool count missing");
  assert(dashboard.totalExecutions >= 4, "dashboard execution count missing");
  console.log("  PASS");

  console.log("Plugin registry extensibility");
  assert(listRegisteredTools().length >= 7, "registry should expose plugin tools");
  const registrySource = readFileSync(
    join(root, "src/modules/ai-tools/registry/tool-registry.ts"),
    "utf8",
  );
  assert(registrySource.includes("registerTool"), "plugin registerTool missing");
  console.log("  PASS");

  console.log("\nAI Tool Execution Framework verification passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
