import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import {
  getMarketingAgentDashboardStats,
  runMarketingAnalysis,
} from "../src/services/ai-marketing-analysis.service";
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
  console.log("AI Marketing Agent module structure");
  const moduleFiles = [
    "src/modules/ai-marketing-agent-management/index.ts",
    "src/modules/ai-marketing-agent-management/constants/routes.ts",
    "src/modules/ai-marketing-agent-management/types/ai-marketing-agent-types.ts",
    "src/modules/ai-marketing-agent-management/lib/get-ai-marketing-agent-context.ts",
    "src/modules/ai-marketing-agent-management/lib/ai-marketing-agent-validation.ts",
    "src/modules/ai-marketing-agent-management/actions/ai-marketing-agent-actions.ts",
    "src/services/ai-marketing-analysis.service.ts",
    "src/services/ai-marketing-campaign-analysis.service.ts",
    "src/services/ai-marketing-audience-analysis.service.ts",
    "src/services/ai-marketing-segmentation.service.ts",
    "src/services/ai-marketing-engagement-analysis.service.ts",
    "src/services/ai-marketing-retention-analysis.service.ts",
    "src/services/ai-marketing-recommendation.service.ts",
    "src/services/ai-marketing-trend-analysis.service.ts",
    "src/services/ai-marketing-agent-permission.service.ts",
    "src/app/app/ai/marketing/page.tsx",
    "src/app/app/ai/marketing/insights/page.tsx",
    "src/app/app/ai/marketing/audience/page.tsx",
    "src/app/app/ai/marketing/segments/page.tsx",
    "src/app/app/ai/marketing/recommendations/page.tsx",
    "src/app/app/ai/marketing/performance/page.tsx",
    "src/app/app/ai/marketing/timeline/page.tsx",
    "src/app/app/ai/marketing/search/page.tsx",
    "prisma/migrations/20250731090000_ai_marketing_agent/migration.sql",
    "prisma/migrations/20250731090100_ai_marketing_agent_permissions/migration.sql",
  ];

  for (const file of moduleFiles) {
    read(file);
  }

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.AI_MARKETING_VIEW), "AI_MARKETING_VIEW missing");
  assert(
    permissions.includes(PERMISSION_CODES.AI_MARKETING_EXECUTE),
    "AI_MARKETING_EXECUTE missing",
  );
  assert(permissions.includes(PERMISSION_CODES.AI_MARKETING_MANAGE), "AI_MARKETING_MANAGE missing");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model AIMarketingInsight"), "AIMarketingInsight model missing");
  assert(schema.includes("model AIMarketingCampaign"), "AIMarketingCampaign model missing");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found for integration test");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  const stats = await getMarketingAgentDashboardStats(ownerId);
  assert(typeof stats.healthScore === "number", "Dashboard stats failed");

  const analysis = await runMarketingAnalysis(ownerId);
  assert(analysis.insightsCreated >= 0, "Marketing analysis failed");

  console.log("AI Marketing Agent verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
