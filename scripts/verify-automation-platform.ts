import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { listActionLibrary } from "../src/services/automation-action-engine.service";
import { executeAutomationWorkflow } from "../src/services/automation-execution-engine.service";
import { listTriggerLibrary } from "../src/services/automation-trigger-engine.service";
import {
  createAutomationWorkflow,
  getAutomationWorkflow,
} from "../src/services/automation-workflow-manager.service";
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
  console.log("Automation Platform module structure");
  const moduleFiles = [
    "src/modules/automation-platform-management/index.ts",
    "src/modules/automation-platform-management/constants/routes.ts",
    "src/modules/automation-platform-management/types/automation-platform-types.ts",
    "src/modules/automation-platform-management/lib/get-automation-platform-context.ts",
    "src/modules/automation-platform-management/lib/automation-platform-validation.ts",
    "src/modules/automation-platform-management/actions/automation-platform-actions.ts",
    "src/modules/automation-platform-management/plugins/bootstrap-automation-templates.ts",
    "src/services/automation-context.service.ts",
    "src/services/automation-workflow-manager.service.ts",
    "src/services/automation-trigger-engine.service.ts",
    "src/services/automation-condition-engine.service.ts",
    "src/services/automation-action-engine.service.ts",
    "src/services/automation-execution-engine.service.ts",
    "src/services/automation-scheduler.service.ts",
    "src/services/automation-retry-manager.service.ts",
    "src/services/automation-logger.service.ts",
    "src/services/automation-execution-history.service.ts",
    "src/services/automation-platform-permission.service.ts",
    "src/app/app/automation/page.tsx",
    "src/app/app/automation/workflows/page.tsx",
    "src/app/app/automation/workflows/new/page.tsx",
    "src/app/app/automation/workflows/[workflowId]/page.tsx",
    "src/app/app/automation/executions/page.tsx",
    "src/app/app/automation/triggers/page.tsx",
    "src/app/app/automation/actions/page.tsx",
    "src/app/app/automation/templates/page.tsx",
    "src/app/app/automation/logs/page.tsx",
    "src/app/app/automation/search/page.tsx",
    "prisma/migrations/20250731160000_automation_platform/migration.sql",
    "prisma/migrations/20250731160100_automation_platform_permissions/migration.sql",
  ];

  for (const file of moduleFiles) {
    read(file);
  }

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.AUTOMATION_VIEW), "AUTOMATION_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.AUTOMATION_CREATE), "AUTOMATION_CREATE missing");
  assert(permissions.includes(PERMISSION_CODES.AUTOMATION_UPDATE), "AUTOMATION_UPDATE missing");
  assert(permissions.includes(PERMISSION_CODES.AUTOMATION_DELETE), "AUTOMATION_DELETE missing");
  assert(permissions.includes(PERMISSION_CODES.AUTOMATION_EXECUTE), "AUTOMATION_EXECUTE missing");

  const schema = read("prisma/schema.prisma");
  assert(
    schema.includes("model AutomationPlatformWorkflow"),
    "AutomationPlatformWorkflow model missing",
  );
  assert(
    schema.includes("model AutomationPlatformTrigger"),
    "AutomationPlatformTrigger model missing",
  );
  assert(
    schema.includes("model AutomationPlatformExecution"),
    "AutomationPlatformExecution model missing",
  );

  assert(listTriggerLibrary().length >= 12, "Trigger library incomplete");
  assert(listActionLibrary().length >= 11, "Action library incomplete");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found for automation test");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  const workflow = await createAutomationWorkflow(ownerId, {
    name: "Verify Automation Workflow",
    description: "Created by verify script",
    triggerType: "MANUAL",
  });
  assert(workflow.id, "Workflow creation failed");

  await prisma.automationPlatformTrigger.create({
    data: { workflowId: workflow.id, type: "manual", event: "manual.event" },
  });
  await prisma.automationPlatformAction.create({
    data: { workflowId: workflow.id, type: "notify.staff", order: 1 },
  });

  const loaded = await getAutomationWorkflow(ownerId, workflow.id);
  assert(loaded?.triggers.length === 1, "Trigger save failed");

  const execution = await executeAutomationWorkflow(ownerId, workflow.id, {
    event: "manual.event",
  });
  assert(execution.status === "COMPLETED", "Workflow execution failed");

  console.log("Automation Platform verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
