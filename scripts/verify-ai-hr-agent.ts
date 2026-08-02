import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { getHrAgentDashboardStats, runHrAnalysis } from "../src/services/ai-hr-analysis.service";
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
  console.log("AI HR Agent module structure");
  const moduleFiles = [
    "src/modules/ai-hr-agent-management/index.ts",
    "src/modules/ai-hr-agent-management/constants/routes.ts",
    "src/modules/ai-hr-agent-management/types/ai-hr-agent-types.ts",
    "src/modules/ai-hr-agent-management/lib/get-ai-hr-agent-context.ts",
    "src/modules/ai-hr-agent-management/lib/ai-hr-agent-validation.ts",
    "src/modules/ai-hr-agent-management/actions/ai-hr-agent-actions.ts",
    "src/services/ai-hr-analysis.service.ts",
    "src/services/ai-hr-insight.service.ts",
    "src/services/ai-hr-performance-analysis.service.ts",
    "src/services/ai-hr-attendance-analysis.service.ts",
    "src/services/ai-hr-shift-optimization.service.ts",
    "src/services/ai-hr-recruitment-analysis.service.ts",
    "src/services/ai-hr-candidate-evaluation.service.ts",
    "src/services/ai-hr-training-recommendation.service.ts",
    "src/services/ai-hr-retention-risk.service.ts",
    "src/services/ai-hr-agent-permission.service.ts",
    "src/app/app/ai/hr/page.tsx",
    "src/app/app/ai/hr/insights/page.tsx",
    "src/app/app/ai/hr/recruitment/page.tsx",
    "src/app/app/ai/hr/performance/page.tsx",
    "src/app/app/ai/hr/attendance/page.tsx",
    "src/app/app/ai/hr/training/page.tsx",
    "src/app/app/ai/hr/recommendations/page.tsx",
    "src/app/app/ai/hr/search/page.tsx",
    "prisma/migrations/20250731110000_ai_hr_agent/migration.sql",
    "prisma/migrations/20250731110100_ai_hr_agent_permissions/migration.sql",
  ];

  for (const file of moduleFiles) {
    read(file);
  }

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.AI_HR_VIEW), "AI_HR_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.AI_HR_EXECUTE), "AI_HR_EXECUTE missing");
  assert(permissions.includes(PERMISSION_CODES.AI_HR_MANAGE), "AI_HR_MANAGE missing");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model AIHRInsight"), "AIHRInsight model missing");
  assert(schema.includes("model AIHRRecommendation"), "AIHRRecommendation model missing");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found for integration test");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  const stats = await getHrAgentDashboardStats(ownerId);
  assert(typeof stats.healthScore === "number", "Dashboard stats failed");

  const analysis = await runHrAnalysis(ownerId);
  assert(analysis.insightsCreated >= 0, "HR analysis failed");
  assert(analysis.recommendationsCreated >= 0, "HR recommendations failed");

  console.log("AI HR Agent verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
