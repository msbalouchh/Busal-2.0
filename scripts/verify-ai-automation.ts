import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import {
  ALL_PERMISSION_CODES,
  PERMISSION_CODES,
} from "../src/modules/authorization/constants/permissions";
import { AI_AUTOMATION_ROUTES } from "../src/modules/ai-automation/constants/routes";
import { AUTOMATION_EVENT_CATEGORIES } from "../src/modules/ai-automation/constants/routes";
import { evaluateConditionExpression } from "../src/modules/ai-automation/engine/condition-engine";
import {
  ensureBootstrapAutomationPlugins,
  DEFAULT_WORKFLOW_TEMPLATES,
} from "../src/modules/ai-automation/plugins/bootstrap-automation";
import {
  listAutomationEvents as listRegisteredAutomationEvents,
  listAutomationActions,
} from "../src/modules/ai-automation/registry/automation-registry";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  approveAutomationExecution,
  createAutomationWorkflow,
  ensureAutomationTemplates,
  getAutomationMonitoringDashboard,
  listAutomationExecutions,
  listAutomationEvents,
  publishAutomationEvent,
  publishAutomationWorkflowVersion,
  triggerAutomationWorkflowManually,
} from "../src/services/ai-automation.service";
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
    "src/modules/ai-automation/index.ts",
    "src/modules/ai-automation/constants/routes.ts",
    "src/modules/ai-automation/types/automation-types.ts",
    "src/modules/ai-automation/registry/automation-registry.ts",
    "src/modules/ai-automation/engine/event-bus.ts",
    "src/modules/ai-automation/engine/condition-engine.ts",
    "src/modules/ai-automation/engine/ai-decision-node.ts",
    "src/modules/ai-automation/engine/action-engine.ts",
    "src/modules/ai-automation/engine/approval-engine.ts",
    "src/modules/ai-automation/engine/workflow-engine.ts",
    "src/modules/ai-automation/plugins/bootstrap-automation.ts",
    "src/modules/ai-automation/utils/ai-automation-utils.ts",
    "src/modules/ai-automation/lib/get-ai-automation-context.ts",
    "src/modules/ai-automation/actions/ai-automation-actions.ts",
    "src/modules/ai-automation/components/ai-automation-dashboard.tsx",
    "src/modules/ai-automation/components/ai-automation-lists.tsx",
    "src/modules/ai-automation/components/ai-automation-nav.tsx",
    "src/services/ai-automation.service.ts",
    "src/app/dashboard/ai-automation/page.tsx",
    "src/app/dashboard/ai-automation/workflows/page.tsx",
    "src/app/dashboard/ai-automation/templates/page.tsx",
    "src/app/dashboard/ai-automation/executions/page.tsx",
    "src/app/dashboard/ai-automation/approvals/page.tsx",
    "src/app/dashboard/ai-automation/events/page.tsx",
    "src/app/dashboard/ai-automation/monitoring/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Automation routes");
  assert(AI_AUTOMATION_ROUTES.overview === "/dashboard/ai-automation", "route mismatch");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/ai-automation/lib/get-ai-automation-context.ts"),
    "utf8",
  );
  const actionsSource = readFileSync(
    join(root, "src/modules/ai-automation/actions/ai-automation-actions.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "pages should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.AI_AUTOMATION_VIEW"), "view permission required");
  assert(
    actionsSource.includes("PERMISSION_CODES.AI_AUTOMATION_EXECUTE"),
    "execute permission required",
  );
  assert(
    PERMISSION_CODES.AI_AUTOMATION_APPROVE === "ai.automation.approve",
    "approve permission missing",
  );
  assert(ALL_PERMISSION_CODES.includes("ai.automation.view"), "permission catalog missing");
  console.log("  PASS");

  console.log("Schema");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("model AutomationWorkflow"), "AutomationWorkflow missing");
  assert(schemaSource.includes("model AutomationEvent"), "AutomationEvent missing");
  assert(
    schemaSource.includes("model AutomationWorkflowExecution"),
    "AutomationWorkflowExecution missing",
  );
  console.log("  PASS");

  console.log("Event categories");
  assert(AUTOMATION_EVENT_CATEGORIES.length === 14, "expected 14 event categories");
  console.log("  PASS");

  console.log("Plugin registry");
  ensureBootstrapAutomationPlugins();
  assert(listRegisteredAutomationEvents().length >= 8, "bootstrap events missing");
  assert(listAutomationActions().length >= 8, "bootstrap actions missing");
  console.log("  PASS");

  console.log("Condition engine");
  const passed = evaluateConditionExpression(
    {
      operator: "AND",
      children: [{ operator: "EQ", field: "eventType", value: "StockLow" }],
    },
    {
      businessId: "biz-1",
      branchId: null,
      userId: null,
      staffId: null,
      permissions: [],
      roleSlug: "owner",
      eventPayload: { eventType: "StockLow", quantity: 2 },
      variables: { eventType: "StockLow", quantity: 2 },
    },
  );
  assert(passed, "condition engine failed");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ select: { id: true } });
  assert(business, "No business found");

  const platform = await buildPlatformContext(business.id);
  assert(
    platform.permissions.includes(PERMISSION_CODES.AI_AUTOMATION_VIEW),
    "owner missing view permission",
  );

  console.log("Workflow templates");
  await ensureAutomationTemplates(business.id);
  assert(DEFAULT_WORKFLOW_TEMPLATES.length >= 3, "templates missing");
  const templates = await prisma.automationWorkflow.count({
    where: { businessId: business.id, isTemplate: true },
  });
  assert(templates >= 3, "templates not seeded");
  console.log("  PASS");

  console.log("Create and publish workflow");
  const suffix = Date.now().toString();
  const created = await createAutomationWorkflow(platform, {
    name: `Stock Alert ${suffix}`,
    description: "Notify staff when stock is low",
    triggerType: "SYSTEM_EVENT",
    triggerConfig: { eventType: "StockLow" },
    nodes: [
      { id: "trigger", type: "TRIGGER", label: "Trigger", config: { eventType: "StockLow" } },
      {
        id: "condition",
        type: "CONDITION",
        label: "Condition",
        config: {
          expression: {
            operator: "AND",
            children: [{ operator: "EQ", field: "eventType", value: "StockLow" }],
          },
        },
      },
      {
        id: "ai",
        type: "AI_DECISION",
        label: "AI Decision",
        config: { prompt: "Should we reorder?", defaultDecision: "reorder" },
      },
      {
        id: "action",
        type: "ACTION",
        label: "Notify",
        config: { actionType: "NOTIFY_STAFF", message: "Stock is low" },
      },
      { id: "done", type: "COMPLETION", label: "Done", config: {} },
    ],
  });
  await publishAutomationWorkflowVersion(platform, created.workflow.id, created.version.id);
  console.log("  PASS");

  console.log("Publish event and execute workflow");
  await publishAutomationEvent({
    businessId: business.id,
    category: "INVENTORY",
    eventType: "StockLow",
    payload: { eventType: "StockLow", sku: `SKU-${suffix}`, quantity: 3 },
    sourceModule: "inventory",
  });

  const eventExecutions = await listAutomationExecutions(business.id, 10);
  assert(
    eventExecutions.some((execution) => execution.status === "COMPLETED"),
    "event-driven execution missing",
  );
  console.log("  PASS");

  console.log("Manual trigger");
  const manualResult = await triggerAutomationWorkflowManually(platform, created.workflow.id, {
    eventType: "StockLow",
    quantity: 1,
  });
  assert(manualResult.status === "COMPLETED", "manual execution failed");
  console.log("  PASS");

  console.log("Human approval pause");
  const approvalWorkflow = await createAutomationWorkflow(platform, {
    name: `Approval Flow ${suffix}`,
    triggerType: "MANUAL",
    triggerConfig: {},
    nodes: [
      { id: "trigger", type: "TRIGGER", label: "Trigger", config: {} },
      {
        id: "approval",
        type: "APPROVAL",
        label: "Cashier Approval",
        config: { approvalType: "CUSTOM", approverRole: "cashier" },
      },
      {
        id: "action",
        type: "ACTION",
        label: "Notify",
        config: { actionType: "NOTIFY_STAFF", message: "Approved action" },
      },
      { id: "done", type: "COMPLETION", label: "Done", config: {} },
    ],
  });
  await publishAutomationWorkflowVersion(
    platform,
    approvalWorkflow.workflow.id,
    approvalWorkflow.version.id,
  );

  const paused = await triggerAutomationWorkflowManually(
    platform,
    approvalWorkflow.workflow.id,
    {},
  );
  assert(paused.awaitingApproval, "approval pause missing");
  assert(paused.approvalRequestId, "approval request missing");

  const approved = await approveAutomationExecution(
    platform,
    paused.approvalRequestId!,
    "Approved",
  );
  assert(approved.status === "COMPLETED", "approval resume failed");
  console.log("  PASS");

  console.log("Event bus history");
  const events = await listAutomationEvents(business.id, 10);
  assert(
    events.some((event) => event.eventType === "StockLow"),
    "published event missing",
  );
  console.log("  PASS");

  console.log("Monitoring dashboard");
  const dashboard = await getAutomationMonitoringDashboard(business.id);
  assert(dashboard.totalExecutions >= 2, "execution metrics missing");
  assert(dashboard.totalEvents >= 1, "event metrics missing");
  console.log("  PASS");

  console.log("Extensibility registry");
  const registrySource = readFileSync(
    join(root, "src/modules/ai-automation/registry/automation-registry.ts"),
    "utf8",
  );
  assert(registrySource.includes("registerAutomationEvent"), "event registration missing");
  assert(registrySource.includes("registerAutomationAction"), "action registration missing");
  console.log("  PASS");

  console.log("\nAI Automation & Workflow Engine verification passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
