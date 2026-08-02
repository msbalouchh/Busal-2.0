import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import {
  getSalesAgentDashboardStats,
  runSalesAnalysis,
} from "../src/services/ai-sales-analysis.service";
import { generateSalesForecast } from "../src/services/ai-sales-forecast.service";
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
  console.log("AI Sales Agent module structure");
  const moduleFiles = [
    "src/modules/ai-sales-agent-management/index.ts",
    "src/modules/ai-sales-agent-management/constants/routes.ts",
    "src/modules/ai-sales-agent-management/types/ai-sales-agent-types.ts",
    "src/modules/ai-sales-agent-management/lib/get-ai-sales-agent-context.ts",
    "src/modules/ai-sales-agent-management/lib/ai-sales-agent-validation.ts",
    "src/modules/ai-sales-agent-management/actions/ai-sales-agent-actions.ts",
    "src/services/ai-sales-analysis.service.ts",
    "src/services/ai-sales-opportunity-detection.service.ts",
    "src/services/ai-sales-revenue-insight.service.ts",
    "src/services/ai-sales-quote-analysis.service.ts",
    "src/services/ai-sales-pipeline-analysis.service.ts",
    "src/services/ai-sales-recommendation.service.ts",
    "src/services/ai-sales-forecast.service.ts",
    "src/services/ai-sales-agent-permission.service.ts",
    "src/app/app/ai/sales/page.tsx",
    "src/app/app/ai/sales/insights/page.tsx",
    "src/app/app/ai/sales/recommendations/page.tsx",
    "src/app/app/ai/sales/opportunities/page.tsx",
    "src/app/app/ai/sales/revenue/page.tsx",
    "src/app/app/ai/sales/search/page.tsx",
    "prisma/migrations/20250731080000_ai_sales_agent/migration.sql",
    "prisma/migrations/20250731080100_ai_sales_agent_permissions/migration.sql",
  ];

  for (const file of moduleFiles) {
    read(file);
  }

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.AI_SALES_VIEW), "AI_SALES_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.AI_SALES_EXECUTE), "AI_SALES_EXECUTE missing");
  assert(permissions.includes(PERMISSION_CODES.AI_SALES_MANAGE), "AI_SALES_MANAGE missing");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model AISalesInsight"), "AISalesInsight model missing");
  assert(schema.includes("model AISalesRecommendation"), "AISalesRecommendation model missing");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found for integration test");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  const stats = await getSalesAgentDashboardStats(ownerId);
  assert(typeof stats.healthScore === "number", "Dashboard stats failed");

  const forecast = await generateSalesForecast(ownerId);
  assert(forecast.projectedRevenuePence >= 0, "Forecast failed");

  const analysis = await runSalesAnalysis(ownerId);
  assert(analysis.insightsCreated >= 0, "Sales analysis failed");

  console.log("AI Sales Agent verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
