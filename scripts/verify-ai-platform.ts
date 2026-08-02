import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { AI_PLATFORM_ROUTES } from "../src/modules/ai-platform/constants/ai-platform";
import {
  composeAssistantResponse,
  getAiPlatformBundle,
} from "../src/services/ai-platform-module.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import { mapProfileToAuthUser } from "../src/services/user.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
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
  console.log("AI platform module structure");
  const moduleFiles = [
    "src/modules/ai-platform/index.ts",
    "src/modules/ai-platform/constants/ai-platform.ts",
    "src/modules/ai-platform/types/ai-platform-types.ts",
    "src/modules/ai-platform/lib/get-ai-platform-context.ts",
    "src/modules/ai-platform/actions/ai-platform-actions.ts",
    "src/modules/ai-platform/components/ai-platform-overview.tsx",
    "src/modules/ai-platform/components/ai-assistant-panel.tsx",
    "src/modules/ai-platform/components/ai-agents-panel.tsx",
    "src/modules/ai-platform/components/ai-knowledge-panel.tsx",
    "src/modules/ai-platform/components/ai-automation-panel.tsx",
    "src/modules/ai-platform/components/ai-tools-panel.tsx",
    "src/modules/ai-platform/components/ai-analytics-panel.tsx",
    "src/modules/ai-platform/components/ai-settings-panel.tsx",
    "src/services/ai-platform-module.service.ts",
    "src/app/dashboard/ai-platform/page.tsx",
    "src/app/dashboard/ai-platform/assistant/page.tsx",
    "src/app/dashboard/ai-platform/agents/page.tsx",
    "src/app/dashboard/ai-platform/knowledge/page.tsx",
    "src/app/dashboard/ai-platform/automation/page.tsx",
    "src/app/dashboard/ai-platform/tools/page.tsx",
    "src/app/dashboard/ai-platform/analytics/page.tsx",
    "src/app/dashboard/ai-platform/settings/page.tsx",
  ];

  for (const file of moduleFiles) {
    read(file);
  }
  console.log("  PASS");

  console.log("Permission-aware guards");
  const contextLoader = read("src/modules/ai-platform/lib/get-ai-platform-context.ts");
  assert(
    contextLoader.includes("PERMISSION_CODES.AI_KNOWLEDGE_VIEW"),
    "AI_KNOWLEDGE_VIEW guard missing",
  );
  assert(contextLoader.includes("PERMISSION_CODES.AI_AGENT_VIEW"), "AI_AGENT_VIEW guard missing");
  assert(
    contextLoader.includes("PERMISSION_CODES.AI_AUTOMATION_VIEW"),
    "AI_AUTOMATION_VIEW guard missing",
  );
  assert(
    contextLoader.includes("PERMISSION_CODES.AI_TOOL_EXECUTE"),
    "AI_TOOL_EXECUTE guard missing",
  );
  const actions = read("src/modules/ai-platform/actions/ai-platform-actions.ts");
  assert(actions.includes("protectedAction"), "protectedAction missing");
  assert(actions.includes("PERMISSION_CODES.AI_KNOWLEDGE_VIEW"), "assistant action guard missing");
  assert(actions.includes("PERMISSION_CODES.SETTINGS_EDIT"), "settings action guard missing");
  console.log("  PASS");

  console.log("Dashboard routes");
  for (const route of Object.values(AI_PLATFORM_ROUTES)) {
    assert(route.startsWith("/dashboard"), `Invalid route: ${route}`);
  }
  console.log("  PASS");

  console.log("Live AI platform workflow");
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  assert(business, "No business found for verification");

  const platform = await buildPlatformContext(business.id);
  const bundle = await getAiPlatformBundle(platform);

  assert(typeof bundle.permissions.canUseChat === "boolean", "Permission flags missing");
  assert(typeof bundle.widgets.totalTokensUsed === "number", "Dashboard widgets missing");
  assert(Array.isArray(bundle.recentConversations), "Recent conversations missing");
  assert(Array.isArray(bundle.recentActivity), "Recent activity missing");

  const assistantResponse = await composeAssistantResponse(
    platform,
    "What policies are available?",
  );
  assert(typeof assistantResponse.content === "string", "Assistant response missing");
  assert(Array.isArray(assistantResponse.citations), "Assistant citations missing");

  console.log("  PASS");
  console.log("\nAI platform verification passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
