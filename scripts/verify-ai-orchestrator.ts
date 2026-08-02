import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { buildWorkflowFromTemplate } from "../src/services/ai-workflow-builder.service";
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflowDashboardStats,
  listWorkflows,
  updateWorkflow,
} from "../src/services/ai-workflow-manager.service";
import { runWorkflow } from "../src/services/ai-workflow-executor.service";
import { getWorkflowTemplates } from "../src/services/ai-workflow-builder.service";
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
  console.log("AI Orchestrator module structure");
  const moduleFiles = [
    "src/modules/ai-orchestrator-management/index.ts",
    "src/modules/ai-orchestrator-management/constants/routes.ts",
    "src/modules/ai-orchestrator-management/types/ai-orchestrator-types.ts",
    "src/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context.ts",
    "src/modules/ai-orchestrator-management/lib/ai-orchestrator-validation.ts",
    "src/modules/ai-orchestrator-management/actions/ai-orchestrator-actions.ts",
    "src/services/ai-workflow-manager.service.ts",
    "src/services/ai-workflow-builder.service.ts",
    "src/services/ai-workflow-executor.service.ts",
    "src/services/ai-workflow-scheduler.service.ts",
    "src/services/ai-execution-manager.service.ts",
    "src/services/ai-execution-monitor.service.ts",
    "src/services/ai-task-router.service.ts",
    "src/services/ai-dependency-resolver.service.ts",
    "src/services/ai-orchestrator-context-manager.service.ts",
    "src/services/ai-workflow-permission.service.ts",
    "src/app/app/ai/orchestrator/page.tsx",
    "src/app/app/ai/orchestrator/workflows/page.tsx",
    "src/app/app/ai/orchestrator/builder/page.tsx",
    "src/app/app/ai/orchestrator/monitor/page.tsx",
    "src/app/app/ai/orchestrator/executions/page.tsx",
    "src/app/app/ai/orchestrator/timeline/page.tsx",
    "src/app/app/ai/orchestrator/search/page.tsx",
    "src/app/app/ai/orchestrator/workflows/[workflowId]/page.tsx",
    "prisma/migrations/20250731070000_ai_orchestrator/migration.sql",
    "prisma/migrations/20250731070100_ai_orchestrator_permissions/migration.sql",
  ];

  for (const file of moduleFiles) {
    read(file);
  }

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.AI_WORKFLOW_VIEW), "AI_WORKFLOW_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.AI_WORKFLOW_CREATE), "AI_WORKFLOW_CREATE missing");
  assert(permissions.includes(PERMISSION_CODES.AI_WORKFLOW_UPDATE), "AI_WORKFLOW_UPDATE missing");
  assert(permissions.includes(PERMISSION_CODES.AI_WORKFLOW_DELETE), "AI_WORKFLOW_DELETE missing");
  assert(permissions.includes(PERMISSION_CODES.AI_WORKFLOW_EXECUTE), "AI_WORKFLOW_EXECUTE missing");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model AIWorkflow"), "AIWorkflow model missing");
  assert(schema.includes("model AIWorkflowStep"), "AIWorkflowStep model missing");
  assert(schema.includes("model AIWorkflowExecution"), "AIWorkflowExecution model missing");

  const templates = getWorkflowTemplates();
  assert(templates.length >= 2, "Workflow templates missing");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found for integration test");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  const built = await buildWorkflowFromTemplate(ownerId, "restaurant-summary");
  assert(built.workflowId, "Template workflow build failed");

  await updateWorkflow(ownerId, built.workflowId, { status: "ACTIVE" });
  const execution = await runWorkflow(ownerId, { workflowId: built.workflowId, input: {} });
  assert(execution.id, "Workflow execution failed");

  const stats = await getWorkflowDashboardStats(ownerId);
  assert(stats.totalWorkflows >= 1, "Dashboard stats failed");

  const list = await listWorkflows(ownerId, { pageSize: 5 });
  assert(list.total >= 1, "Workflow list failed");

  const custom = await createWorkflow(ownerId, {
    name: `Verify Workflow ${Date.now()}`,
    description: "Verification workflow",
    steps: [{ order: 1, configuration: { label: "noop" } }],
  });
  await deleteWorkflow(ownerId, custom.id);
  await deleteWorkflow(ownerId, built.workflowId);

  console.log("AI Orchestrator verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
