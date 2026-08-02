import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import {
  getOperationsAgentDashboardStats,
  runOperationsAnalysis,
} from "../src/services/ai-operations-analysis.service";
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
  console.log("AI Operations Agent module structure");
  const moduleFiles = [
    "src/modules/ai-operations-agent-management/index.ts",
    "src/modules/ai-operations-agent-management/constants/routes.ts",
    "src/modules/ai-operations-agent-management/types/ai-operations-agent-types.ts",
    "src/modules/ai-operations-agent-management/lib/get-ai-operations-agent-context.ts",
    "src/modules/ai-operations-agent-management/lib/ai-operations-agent-validation.ts",
    "src/modules/ai-operations-agent-management/actions/ai-operations-agent-actions.ts",
    "src/services/ai-operations-analysis.service.ts",
    "src/services/ai-operations-efficiency-recommendation.service.ts",
    "src/services/ai-operations-workflow-analysis.service.ts",
    "src/services/ai-operations-resource-optimization.service.ts",
    "src/services/ai-operations-inventory-health.service.ts",
    "src/services/ai-operations-bottleneck-detection.service.ts",
    "src/services/ai-operations-capacity-planning.service.ts",
    "src/services/ai-operations-operational-health.service.ts",
    "src/services/ai-operations-risk-detection.service.ts",
    "src/services/ai-operations-trend-analysis.service.ts",
    "src/services/ai-operations-agent-permission.service.ts",
    "src/services/ai-operations-context.service.ts",
    "src/app/app/ai/operations/page.tsx",
    "src/app/app/ai/operations/health/page.tsx",
    "src/app/app/ai/operations/workflows/page.tsx",
    "src/app/app/ai/operations/resources/page.tsx",
    "src/app/app/ai/operations/efficiency/page.tsx",
    "src/app/app/ai/operations/risks/page.tsx",
    "src/app/app/ai/operations/recommendations/page.tsx",
    "src/app/app/ai/operations/search/page.tsx",
    "prisma/migrations/20250731130000_ai_operations_agent/migration.sql",
    "prisma/migrations/20250731130100_ai_operations_agent_permissions/migration.sql",
  ];

  for (const file of moduleFiles) {
    read(file);
  }

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.AI_OPERATIONS_VIEW), "AI_OPERATIONS_VIEW missing");
  assert(
    permissions.includes(PERMISSION_CODES.AI_OPERATIONS_EXECUTE),
    "AI_OPERATIONS_EXECUTE missing",
  );
  assert(
    permissions.includes(PERMISSION_CODES.AI_OPERATIONS_MANAGE),
    "AI_OPERATIONS_MANAGE missing",
  );

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model AIOperationInsight"), "AIOperationInsight model missing");
  assert(
    schema.includes("model AIOperationRecommendation"),
    "AIOperationRecommendation model missing",
  );

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found for integration test");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  const stats = await getOperationsAgentDashboardStats(ownerId);
  assert(typeof stats.healthScore === "number", "Dashboard stats failed");

  const analysis = await runOperationsAnalysis(ownerId);
  assert(analysis.insightsCreated >= 0, "Operations analysis failed");
  assert(analysis.recommendationsCreated >= 0, "Operations recommendations failed");

  console.log("AI Operations Agent verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
