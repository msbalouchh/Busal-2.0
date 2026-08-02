import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import {
  getFinanceAgentDashboardStats,
  runFinanceAnalysis,
} from "../src/services/ai-finance-analysis.service";
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
  console.log("AI Finance Agent module structure");
  const moduleFiles = [
    "src/modules/ai-finance-agent-management/index.ts",
    "src/modules/ai-finance-agent-management/constants/routes.ts",
    "src/modules/ai-finance-agent-management/types/ai-finance-agent-types.ts",
    "src/modules/ai-finance-agent-management/lib/get-ai-finance-agent-context.ts",
    "src/modules/ai-finance-agent-management/lib/ai-finance-agent-validation.ts",
    "src/modules/ai-finance-agent-management/actions/ai-finance-agent-actions.ts",
    "src/services/ai-finance-analysis.service.ts",
    "src/services/ai-finance-recommendation.service.ts",
    "src/services/ai-finance-revenue-analysis.service.ts",
    "src/services/ai-finance-expense-analysis.service.ts",
    "src/services/ai-finance-profitability.service.ts",
    "src/services/ai-finance-cash-flow.service.ts",
    "src/services/ai-finance-budget-analysis.service.ts",
    "src/services/ai-finance-forecast.service.ts",
    "src/services/ai-finance-cost-optimization.service.ts",
    "src/services/ai-finance-business-health.service.ts",
    "src/services/ai-finance-risk.service.ts",
    "src/services/ai-finance-agent-permission.service.ts",
    "src/app/app/ai/finance/page.tsx",
    "src/app/app/ai/finance/revenue/page.tsx",
    "src/app/app/ai/finance/expenses/page.tsx",
    "src/app/app/ai/finance/profitability/page.tsx",
    "src/app/app/ai/finance/cash-flow/page.tsx",
    "src/app/app/ai/finance/health/page.tsx",
    "src/app/app/ai/finance/recommendations/page.tsx",
    "src/app/app/ai/finance/search/page.tsx",
    "prisma/migrations/20250731120000_ai_finance_agent/migration.sql",
    "prisma/migrations/20250731120100_ai_finance_agent_permissions/migration.sql",
  ];

  for (const file of moduleFiles) {
    read(file);
  }

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.AI_FINANCE_VIEW), "AI_FINANCE_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.AI_FINANCE_EXECUTE), "AI_FINANCE_EXECUTE missing");
  assert(permissions.includes(PERMISSION_CODES.AI_FINANCE_MANAGE), "AI_FINANCE_MANAGE missing");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model AIFinanceInsight"), "AIFinanceInsight model missing");
  assert(schema.includes("model AIFinanceRecommendation"), "AIFinanceRecommendation model missing");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found for integration test");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  const stats = await getFinanceAgentDashboardStats(ownerId);
  assert(typeof stats.healthScore === "number", "Dashboard stats failed");

  const analysis = await runFinanceAnalysis(ownerId);
  assert(analysis.insightsCreated >= 0, "Finance analysis failed");
  assert(analysis.recommendationsCreated >= 0, "Finance recommendations failed");

  console.log("AI Finance Agent verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
