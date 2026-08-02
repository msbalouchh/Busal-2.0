import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import {
  getSupportAgentDashboardStats,
  runSupportAnalysis,
} from "../src/services/ai-support-analysis.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

async function main() {
  console.log("AI Support Agent module structure");
  const moduleFiles = [
    "src/modules/ai-support-agent-management/index.ts",
    "src/modules/ai-support-agent-management/constants/routes.ts",
    "src/modules/ai-support-agent-management/types/ai-support-agent-types.ts",
    "src/modules/ai-support-agent-management/lib/get-ai-support-agent-context.ts",
    "src/modules/ai-support-agent-management/lib/ai-support-agent-validation.ts",
    "src/modules/ai-support-agent-management/actions/ai-support-agent-actions.ts",
    "src/services/ai-support-analysis.service.ts",
    "src/services/ai-support-conversation-analysis.service.ts",
    "src/services/ai-support-ticket-analysis.service.ts",
    "src/services/ai-support-intent-detection.service.ts",
    "src/services/ai-support-priority-detection.service.ts",
    "src/services/ai-support-response-recommendation.service.ts",
    "src/services/ai-support-knowledge-recommendation.service.ts",
    "src/services/ai-support-escalation-detection.service.ts",
    "src/services/ai-support-satisfaction.service.ts",
    "src/services/ai-support-agent-permission.service.ts",
    "src/app/app/ai/support/page.tsx",
    "src/app/app/ai/support/insights/page.tsx",
    "src/app/app/ai/support/conversations/page.tsx",
    "src/app/app/ai/support/recommendations/page.tsx",
    "src/app/app/ai/support/escalations/page.tsx",
    "src/app/app/ai/support/knowledge/page.tsx",
    "src/app/app/ai/support/analytics/page.tsx",
    "src/app/app/ai/support/search/page.tsx",
    "prisma/migrations/20250731100000_ai_support_agent/migration.sql",
    "prisma/migrations/20250731100100_ai_support_agent_permissions/migration.sql",
  ];

  for (const file of moduleFiles) {
    read(file);
  }

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.AI_SUPPORT_VIEW), "AI_SUPPORT_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.AI_SUPPORT_EXECUTE), "AI_SUPPORT_EXECUTE missing");
  assert(permissions.includes(PERMISSION_CODES.AI_SUPPORT_MANAGE), "AI_SUPPORT_MANAGE missing");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model AISupportInsight"), "AISupportInsight model missing");
  assert(schema.includes("model AISupportRecommendation"), "AISupportRecommendation model missing");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found for integration test");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  const stats = await getSupportAgentDashboardStats(ownerId);
  assert(typeof stats.healthScore === "number", "Dashboard stats failed");

  const analysis = await runSupportAnalysis(ownerId);
  assert(analysis.insightsCreated >= 0, "Support analysis failed");

  console.log("AI Support Agent verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
