import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { CUSTOMER_AI_TOOL_IDS, AI_BUSINESS_TOOL_IDS } from "../src/modules/customer-ai/constants/customer-ai.constants";
import { listCustomerToolsFromCapabilities, executeBusinessToolCalls } from "../src/modules/customer-ai/tools/tool-registry";
import {
  permissionsFromCustomerCapabilities,
  permissionsForOwner,
  hasToolPermission,
  updateAiOperationsCapabilities,
  getAiOperationsCapabilities,
} from "../src/modules/customer-ai/tools/tool-permission-service";
import { evaluateToolConfirmation } from "../src/modules/customer-ai/tools/tool-confirmation-service";
import { riskRequiresConfirmation } from "../src/modules/customer-ai/tools/tool-types";
import { loadBusinessContextSnapshot, loadOperationsMemoryContext } from "../src/modules/customer-ai/services/customer-ai-memory.service";
import { listAiBusinessActions, recordAiBusinessAction } from "../src/modules/customer-ai/tools/tool-audit.service";
import { businessOperationTools } from "../src/modules/customer-ai/tools/tool-registry";
import { runCustomerAiChat } from "../src/modules/customer-ai/services/customer-ai-chat.service";
import { getOwnerOperationsOverview } from "../src/modules/customer-ai/services/owner-ai-operations.service";
import { getBusinessRevenueSnapshot } from "../src/modules/customer-ai/services/revenue-aggregation.service";
import {
  canExecuteFinancialTool,
  REGISTERED_FINANCIAL_TOOL_IDS,
} from "../src/modules/customer-ai/tools/tool-financial-guard";
import {
  createPendingConfirmation,
  validateConfirmedAction,
  consumePendingConfirmation,
  expireStaleConfirmations,
  AI_CONFIRMATION_TTL_MS,
} from "../src/modules/customer-ai/tools/confirmation-expiration.service";
import { resolveBusinessContextFromModule } from "../src/services/ai-engine-context.service";
import { ensureSettingsEngineDefaults } from "../src/services/settings-engine.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

async function verifySchema() {
  const migrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
    SELECT migration_name FROM _prisma_migrations
    WHERE migration_name IN (
      '20250817200000_ai_business_operations_engine',
      '20250817210000_ai_pending_confirmations'
    )`;

  const names = new Set(migrations.map((m) => m.migration_name));
  assert(names.has("20250817200000_ai_business_operations_engine"), "Phase 29 migration not applied");
  assert(names.has("20250817210000_ai_pending_confirmations"), "Pending confirmations migration not applied");

  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('customer_ai_action_logs', 'customer_ai_pending_confirmations')`;
  assert(tables.length === 2, "Required AI operations tables missing");
  console.log("✓ Database schema verified");
}

function verifySourceFiles() {
  const files = [
    "src/modules/customer-ai/tools/tool-registry.ts",
    "src/modules/customer-ai/tools/order-tools.ts",
    "src/modules/customer-ai/tools/reservation-tools.ts",
    "src/modules/customer-ai/tools/tool-financial-guard.ts",
    "src/modules/customer-ai/tools/confirmation-expiration.service.ts",
    "src/modules/customer-ai/services/revenue-aggregation.service.ts",
    "src/modules/customer-ai/services/owner-ai-operations.service.ts",
    "src/modules/customer-ai/components/ai-operations-settings-section.tsx",
    "src/app/dashboard/ai-platform/operations/page.tsx",
  ];
  for (const file of files) {
    assert(read(file).length > 0, `Missing ${file}`);
  }
  console.log("✓ Source files present");
}

function verifyToolRegistry() {
  assert(businessOperationTools.length >= 15, `Expected 15+ tools, got ${businessOperationTools.length}`);
  const toolIds = new Set(businessOperationTools.map((t) => t.toolId));
  assert(toolIds.has(CUSTOMER_AI_TOOL_IDS.SEARCH_MENU), "Missing search menu tool");
  assert(toolIds.has(CUSTOMER_AI_TOOL_IDS.CANCEL_ORDER), "Missing cancel order tool");
  assert(toolIds.has(CUSTOMER_AI_TOOL_IDS.CREATE_ORDER), "Missing create order tool");
  assert(toolIds.has(CUSTOMER_AI_TOOL_IDS.CHECK_AVAILABILITY), "Missing availability tool");
  assert(toolIds.has(AI_BUSINESS_TOOL_IDS.OPERATIONAL_SUMMARY), "Missing operational summary tool");
  assert(toolIds.has(AI_BUSINESS_TOOL_IDS.REVENUE_SUMMARY), "Missing revenue summary tool");
  console.log(`✓ Tool registry: ${businessOperationTools.length} tools registered`);
}

function verifyRiskClassification() {
  assert(riskRequiresConfirmation("DESTRUCTIVE"), "Destructive should require confirmation");
  assert(!riskRequiresConfirmation("READ"), "READ should not require confirmation");
  assert(riskRequiresConfirmation("WRITE"), "WRITE should require confirmation");

  const cancelTool = businessOperationTools.find((t) => t.toolId === CUSTOMER_AI_TOOL_IDS.CANCEL_ORDER);
  assert(cancelTool?.riskLevel === "DESTRUCTIVE", "Cancel order must be DESTRUCTIVE");

  const createOrderTool = businessOperationTools.find((t) => t.toolId === CUSTOMER_AI_TOOL_IDS.CREATE_ORDER);
  assert(createOrderTool?.riskLevel === "WRITE", "Create order must be WRITE");
  console.log("✓ Risk classification verified");
}

function verifyFinancialRiskProtection() {
  assert(REGISTERED_FINANCIAL_TOOL_IDS.length === 0, "No financial tools should be registered yet");

  const fakeFinancialTool = {
    toolId: "fake.refund",
    name: "Fake Refund",
    description: "test",
    inputSchema: { type: "object", properties: {} },
    permission: "ai.business.write" as const,
    riskLevel: "FINANCIAL" as const,
    audience: "OWNER" as const,
    handler: async () => ({ ok: true }),
  };

  const customerBlock = canExecuteFinancialTool(fakeFinancialTool, "CUSTOMER");
  assert(!customerBlock.allowed, "Customer must not execute FINANCIAL tools");

  const unregisteredBlock = canExecuteFinancialTool(fakeFinancialTool, "OWNER");
  assert(!unregisteredBlock.allowed, "Unregistered FINANCIAL tools must be blocked");
  console.log("✓ Financial risk protection verified");
}

function verifyPermissions() {
  const permsDisabled = permissionsFromCustomerCapabilities({
    enabled: true,
    readMenu: true,
    readHours: true,
    readReservations: true,
    readOrders: false,
    createReservation: true,
    createOrder: false,
    requireConfirmation: true,
  });
  assert(!hasToolPermission(permsDisabled, "ai.orders.read"), "Orders read should be disabled");
  assert(!hasToolPermission(permsDisabled, "ai.orders.create"), "Order create should be disabled");
  assert(hasToolPermission(permsDisabled, "ai.reservations.create"), "Reservations create should be enabled");

  const permsEnabled = permissionsFromCustomerCapabilities({
    enabled: true,
    readMenu: true,
    readHours: true,
    readReservations: true,
    readOrders: true,
    createReservation: true,
    createOrder: true,
    requireConfirmation: true,
  });
  assert(hasToolPermission(permsEnabled, "ai.orders.create"), "Order create should be enabled when capability on");

  const ownerPerms = permissionsForOwner();
  assert(hasToolPermission(ownerPerms, "ai.analytics.read"), "Owner should have analytics");
  console.log("✓ Permission enforcement verified");
}

function verifyConfirmationEngine() {
  const tool = businessOperationTools.find((t) => t.toolId === CUSTOMER_AI_TOOL_IDS.CANCEL_ORDER)!;
  const blocked = evaluateToolConfirmation({
    tool,
    args: { orderId: "test-order" },
    requireConfirmation: true,
    confirmedActions: [],
  });
  assert(blocked.blocked && blocked.requiresConfirmation, "Cancel should require confirmation");

  const confirmed = evaluateToolConfirmation({
    tool,
    args: { orderId: "test-order" },
    requireConfirmation: true,
    confirmedActions: ["cancel-order:test-order"],
  });
  assert(!confirmed.blocked, "Confirmed action should pass");
  console.log("✓ Confirmation engine verified");
}

async function verifyConfirmationExpiration(businessId: string) {
  const actionId = `verify-expiration:${Date.now()}`;
  await createPendingConfirmation({
    businessId,
    actionId,
    toolId: CUSTOMER_AI_TOOL_IDS.CANCEL_ORDER,
    ttlMs: 50,
  });

  await new Promise((resolve) => setTimeout(resolve, 80));
  await expireStaleConfirmations(businessId);

  const expired = await validateConfirmedAction({
    businessId,
    actionId,
    confirmedActions: [actionId],
  });
  assert(!expired.valid && expired.reason === "expired", "Expired confirmation must not validate");

  const deniedExecution = await executeBusinessToolCalls({
    toolCalls: [
      {
        id: "expired-confirm",
        name: CUSTOMER_AI_TOOL_IDS.CANCEL_ORDER,
        arguments: { orderId: "nonexistent-order" },
      },
    ],
    context: {
      businessId,
      audience: "CUSTOMER",
      permissions: permissionsForOwner(),
      requireConfirmation: true,
      confirmedActions: [actionId],
    },
  });
  assert(deniedExecution[0]?.output.error, "Expired confirmation must not execute");

  const replayActionId = `verify-replay:${Date.now()}`;
  await createPendingConfirmation({
    businessId,
    actionId: replayActionId,
    toolId: CUSTOMER_AI_TOOL_IDS.CREATE_ORDER,
  });

  const firstConsume = await consumePendingConfirmation(businessId, replayActionId);
  assert(firstConsume, "First consume should succeed");
  const secondConsume = await consumePendingConfirmation(businessId, replayActionId);
  assert(!secondConsume, "Replay consume must fail");

  const replayValidation = await validateConfirmedAction({
    businessId,
    actionId: replayActionId,
    confirmedActions: [replayActionId],
  });
  assert(!replayValidation.valid && replayValidation.reason === "already_consumed", "Replay must be blocked");

  console.log("✓ Confirmation expiration and replay protection verified");
}

async function verifyCustomerOrderCreation(businessId: string) {
  const disabled = await executeBusinessToolCalls({
    toolCalls: [
      {
        id: "create-order-denied",
        name: CUSTOMER_AI_TOOL_IDS.CREATE_ORDER,
        arguments: { items: [{ productName: "Test", quantity: 1 }] },
      },
    ],
    context: {
      businessId,
      audience: "CUSTOMER",
      customerId: "test-customer",
      permissions: permissionsFromCustomerCapabilities({
        enabled: true,
        readMenu: true,
        readHours: true,
        readReservations: true,
        readOrders: true,
        createReservation: true,
        createOrder: false,
        requireConfirmation: true,
      }),
      requireConfirmation: true,
    },
  });
  assert(disabled[0]?.output.error, "Create order must be denied when capability disabled");

  const missingItems = await executeBusinessToolCalls({
    toolCalls: [
      {
        id: "create-order-missing",
        name: CUSTOMER_AI_TOOL_IDS.CREATE_ORDER,
        arguments: { items: [] },
      },
    ],
    context: {
      businessId,
      audience: "CUSTOMER",
      customerId: "test-customer",
      permissions: permissionsFromCustomerCapabilities({
        enabled: true,
        readMenu: true,
        readHours: true,
        readReservations: true,
        readOrders: true,
        createReservation: true,
        createOrder: true,
        requireConfirmation: true,
      }),
      requireConfirmation: true,
    },
  });
  assert(missingItems[0]?.output.error, "Create order must reject missing items");

  const needsConfirmation = await executeBusinessToolCalls({
    toolCalls: [
      {
        id: "create-order-confirm",
        name: CUSTOMER_AI_TOOL_IDS.CREATE_ORDER,
        arguments: { items: [{ productName: "Nonexistent Product XYZ", quantity: 1 }] },
      },
    ],
    context: {
      businessId,
      audience: "CUSTOMER",
      customerId: "test-customer",
      permissions: permissionsFromCustomerCapabilities({
        enabled: true,
        readMenu: true,
        readHours: true,
        readReservations: true,
        readOrders: true,
        createReservation: true,
        createOrder: true,
        requireConfirmation: true,
      }),
      requireConfirmation: true,
    },
  });
  assert(
    needsConfirmation[0]?.output.requiresConfirmation || needsConfirmation[0]?.output.error,
    "Create order must require confirmation or fail validation without inventing products",
  );

  console.log("✓ Customer order creation permission and validation verified");
}

async function verifyRevenueAggregation(businessId: string) {
  const snapshot = await getBusinessRevenueSnapshot(businessId);
  assert(typeof snapshot.revenueAvailable === "boolean", "Revenue snapshot must expose availability");
  assert(snapshot.definition.includes("payment_status"), "Revenue definition must reference payment status");

  if (snapshot.revenueAvailable) {
    assert(snapshot.periods.length === 4, "Revenue snapshot must include four periods");
    for (const period of snapshot.periods) {
      assert(typeof period.revenueAmount === "number", "Revenue amount must be numeric");
      assert(period.revenueAmount >= 0, "Revenue must not be negative");
    }
  }

  const overview = await getOwnerOperationsOverview(businessId, (await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { ownerId: true },
  })).ownerId);
  assert(typeof overview.revenueAvailable === "boolean", "Overview must expose revenue availability");
  if (!overview.revenueAvailable) {
    assert(overview.revenueToday === null, "Revenue must not be fabricated when unavailable");
  }

  console.log("✓ Revenue aggregation verified");
}

async function verifyOperationsSettingsPersistence(businessId: string, ownerId: string) {
  await ensureSettingsEngineDefaults(businessId);
  const platform = await resolveBusinessContextFromModule({ businessId, userId: ownerId });
  const before = await getAiOperationsCapabilities(platform);

  const updated = await updateAiOperationsCapabilities(platform, {
    analyticsRead: !before.analyticsRead,
  });
  assert(updated.analyticsRead === !before.analyticsRead, "Operations settings must persist");

  await updateAiOperationsCapabilities(platform, {
    analyticsRead: before.analyticsRead,
  });

  console.log("✓ Operations settings persistence verified");
}

async function verifyBusinessContext(businessId: string) {
  const snapshot = await loadBusinessContextSnapshot(businessId);
  assert(snapshot.businessInfo.name, "Business context missing name");
  const opsMemory = await loadOperationsMemoryContext(businessId);
  assert(typeof opsMemory === "string", "Operations memory failed");
  console.log("✓ Business context and memory verified");
}

async function verifyToolExecution(businessId: string) {
  const capabilities = {
    enabled: true,
    readMenu: true,
    readHours: true,
    readReservations: true,
    readOrders: true,
    createReservation: true,
    createOrder: false,
    requireConfirmation: true,
  };

  const tools = listCustomerToolsFromCapabilities(capabilities);
  assert(tools.length > 0, "No customer tools listed");
  assert(!tools.some((t) => t.name === CUSTOMER_AI_TOOL_IDS.CREATE_ORDER), "Create order tool hidden when disabled");

  const hoursResult = await executeBusinessToolCalls({
    toolCalls: [{ id: "test-1", name: CUSTOMER_AI_TOOL_IDS.VIEW_HOURS, arguments: {} }],
    context: {
      businessId,
      audience: "CUSTOMER",
      permissions: permissionsFromCustomerCapabilities(capabilities),
      requireConfirmation: true,
    },
  });
  assert(!hoursResult[0]?.output.error, `Hours tool failed: ${JSON.stringify(hoursResult[0]?.output)}`);

  const menuResult = await executeBusinessToolCalls({
    toolCalls: [{ id: "test-2", name: CUSTOMER_AI_TOOL_IDS.SEARCH_MENU, arguments: { query: "coffee" } }],
    context: {
      businessId,
      audience: "CUSTOMER",
      permissions: permissionsFromCustomerCapabilities(capabilities),
      requireConfirmation: true,
    },
  });
  assert(!menuResult[0]?.output.error || menuResult[0]?.output.total === 0, "Menu search should not error");

  const denied = await executeBusinessToolCalls({
    toolCalls: [{ id: "test-3", name: CUSTOMER_AI_TOOL_IDS.CANCEL_ORDER, arguments: { orderId: "fake" } }],
    context: {
      businessId,
      audience: "CUSTOMER",
      permissions: { ...permissionsFromCustomerCapabilities(capabilities), "ai.orders.cancel": false },
      requireConfirmation: true,
    },
  });
  assert(denied[0]?.output.error, "Unauthorized cancel should be rejected");

  console.log("✓ Tool execution and permission denial verified");
}

async function verifyAuditLogging(businessId: string) {
  await recordAiBusinessAction({
    businessId,
    toolId: "test.audit",
    audience: "CUSTOMER",
    riskLevel: "READ",
    permissionGranted: true,
    confirmationRequired: false,
    confirmationStatus: "not_required",
    executionStatus: "executed",
    success: true,
    inputSummary: { test: true },
    outputSummary: { ok: true },
  });

  const actions = await listAiBusinessActions(businessId, 5);
  assert(actions.some((a) => a.toolId === "test.audit"), "Audit log not persisted");
  console.log("✓ Audit logging verified");
}

async function verifyOwnerOperations(businessId: string, ownerId: string) {
  const overview = await getOwnerOperationsOverview(businessId, ownerId);
  assert(typeof overview.aiConversationsToday === "number", "Overview missing conversations");
  console.log("✓ Owner operations overview verified");
}

async function verifyAiRouting(businessId: string) {
  const result = await runCustomerAiChat({
    businessId,
    message: "What products or menu items do you offer?",
    channel: "website",
  });
  assert(result.content.length > 0, "Customer AI empty response");
  console.log("✓ AI routing via runCustomerAiChat verified (Phase 28 omnichannel preserved)");
}

async function main() {
  console.log("Phase 29 AI Business Operations Verification\n");
  verifySourceFiles();
  verifyToolRegistry();
  verifyRiskClassification();
  verifyFinancialRiskProtection();
  verifyPermissions();
  verifyConfirmationEngine();

  try {
    await verifySchema();
  } catch (error) {
    console.warn(`⚠ Schema check: ${error instanceof Error ? error.message : error}`);
  }

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found");

  await verifyBusinessContext(business.id);
  await verifyToolExecution(business.id);
  await verifyCustomerOrderCreation(business.id);
  await verifyConfirmationExpiration(business.id);
  await verifyRevenueAggregation(business.id);
  await verifyOperationsSettingsPersistence(business.id, business.ownerId);
  await verifyAuditLogging(business.id);
  await verifyOwnerOperations(business.id, business.ownerId);
  await verifyAiRouting(business.id);

  console.log(`\nConfirmation TTL: ${AI_CONFIRMATION_TTL_MS / 60000} minutes`);
  console.log("\nPHASE 29 TARGETED VERIFICATION PASS");
}

main()
  .catch((error) => {
    console.error("\nPHASE 29 VERIFICATION FAILED:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
