import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATIONS_ROUTES,
} from "../src/modules/notifications/constants/routes";
import {
  renderTemplate,
  validateTemplateVariables,
} from "../src/modules/notifications/engine/template-engine";
import {
  selectApplicableRules,
  resolveDeliveryMode,
} from "../src/modules/notifications/engine/rule-engine";
import { filterChannelsByPreferences } from "../src/modules/notifications/engine/delivery-engine";
import { planNotificationDelivery } from "../src/modules/notifications/engine/notification-engine";
import {
  DEFAULT_NOTIFICATION_CHANNELS,
  ensureBootstrapNotifications,
} from "../src/modules/notifications/plugins/bootstrap-notifications";
import { listNotificationChannels } from "../src/modules/notifications/registry/notification-registry";
import {
  ALL_PERMISSION_CODES,
  PERMISSION_CODES,
} from "../src/modules/authorization/constants/permissions";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  bulkInboxAction,
  createNotificationDeliveryRule,
  createNotificationTemplate,
  ensureNotificationDefaults,
  getNotificationDashboard,
  listNotificationAuditLogs,
  listNotificationDeliveries,
  listNotificationInbox,
  listNotificationTemplates,
  markInboxItemRead,
  publishNotificationEvent,
  trackDeliveryEngagement,
  updateNotificationUserPreferences,
} from "../src/services/notifications.service";
import { mapProfileToAuthUser } from "../src/services/user.service";
import { bootstrapVerificationEnvironment } from "./lib/verify-bootstrap";
import { connectWithRetry, handleVerificationError } from "./lib/verify-db";
import {
  logProviderVerificationResults,
  verifyCommunicationProviders,
} from "./lib/verify-providers";

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
  bootstrapVerificationEnvironment();
  await connectWithRetry(prisma);

  console.log("Module structure");
  const moduleFiles = [
    "src/modules/notifications/index.ts",
    "src/modules/notifications/constants/routes.ts",
    "src/modules/notifications/types/notification-types.ts",
    "src/modules/notifications/registry/notification-registry.ts",
    "src/modules/notifications/engine/template-engine.ts",
    "src/modules/notifications/engine/rule-engine.ts",
    "src/modules/notifications/engine/delivery-engine.ts",
    "src/modules/notifications/engine/notification-engine.ts",
    "src/modules/notifications/plugins/bootstrap-notifications.ts",
    "src/modules/notifications/utils/notification-utils.ts",
    "src/modules/notifications/lib/get-notifications-context.ts",
    "src/modules/notifications/actions/notification-actions.ts",
    "src/modules/notifications/components/notifications-dashboard.tsx",
    "src/modules/notifications/components/notifications-lists.tsx",
    "src/modules/notifications/components/notifications-nav.tsx",
    "src/services/notifications.service.ts",
    "src/app/dashboard/notifications/page.tsx",
    "src/app/dashboard/notifications/inbox/page.tsx",
    "src/app/dashboard/notifications/templates/page.tsx",
    "src/app/dashboard/notifications/rules/page.tsx",
    "src/app/dashboard/notifications/channels/page.tsx",
    "src/app/dashboard/notifications/deliveries/page.tsx",
    "src/app/dashboard/notifications/preferences/page.tsx",
    "src/app/dashboard/notifications/audit/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Notification routes");
  assert(NOTIFICATIONS_ROUTES.overview === "/dashboard/notifications", "Overview route mismatch");
  assert(NOTIFICATIONS_ROUTES.inbox.includes("inbox"), "Inbox route missing");
  console.log("  PASS");

  console.log("Permission protected");
  const permissionsSource = readFileSync(
    join(root, "src/modules/authorization/constants/permissions.ts"),
    "utf8",
  );
  assert(permissionsSource.includes("notifications.view"), "notifications.view missing");
  assert(permissionsSource.includes("notifications.publish"), "notifications.publish missing");
  assert(
    ALL_PERMISSION_CODES.includes(PERMISSION_CODES.NOTIFICATIONS_VIEW),
    "Permission code missing",
  );
  console.log("  PASS");

  console.log("Schema");
  const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schema.includes("model NotificationTemplate"), "NotificationTemplate missing");
  assert(schema.includes("model NotificationDelivery"), "NotificationDelivery missing");
  assert(schema.includes("model NotificationInboxItem"), "NotificationInboxItem missing");
  assert(schema.includes("model NotificationAuditLog"), "NotificationAuditLog missing");
  console.log("  PASS");

  console.log("Notification channels");
  ensureBootstrapNotifications();
  const channels = listNotificationChannels();
  assert(channels.length >= DEFAULT_NOTIFICATION_CHANNELS.length, "Channels not registered");
  assert(
    channels.some((c) => c.channel === "SLACK" && !c.isIntegrated),
    "Slack architecture missing",
  );
  console.log("  PASS");

  console.log("Template engine");
  const rendered = renderTemplate({
    subject: "Order #{{orderNumber}}",
    body: "Hello {{name}}, your order is ready.",
    variables: { orderNumber: "1001", name: "Alice" },
  });
  assert(rendered.body.includes("Alice"), "Template body not rendered");
  assert(rendered.subject?.includes("1001"), "Template subject not rendered");
  const validation = validateTemplateVariables(
    [{ key: "name", description: "Name", required: true }],
    { name: "Bob" },
  );
  assert(validation.valid, "Template validation failed");
  console.log("  PASS");

  console.log("Rule engine");
  const rules = [
    {
      id: "rule-1",
      mode: "IMMEDIATE" as const,
      priority: "HIGH" as const,
      category: "ORDERS" as const,
      channel: "IN_APP" as const,
      silent: false,
      businessHoursOnly: false,
      retryCount: 2,
      retryDelayMinutes: 5,
      isActive: true,
    },
  ];
  const applicable = selectApplicableRules(rules, {
    category: "ORDERS",
    priority: "NORMAL",
    now: new Date("2026-07-28T12:00:00Z"),
  });
  assert(applicable.length === 1, "Rule selection failed");
  assert(resolveDeliveryMode(applicable) === "IMMEDIATE", "Delivery mode resolution failed");
  console.log("  PASS");

  console.log("Delivery engine");
  const filtered = filterChannelsByPreferences(
    ["IN_APP", "EMAIL", "SMS"],
    {
      userId: "user-1",
      enabledChannels: ["IN_APP", "EMAIL"],
      disabledCategories: [],
      quietHoursStart: null,
      quietHoursEnd: null,
      language: "en",
      digestFrequency: "DAILY",
    },
    "ORDERS",
  );
  assert(filtered.length === 2, "Channel preference filter failed");
  console.log("  PASS");

  console.log("Notification engine plan");
  const plan = planNotificationDelivery({
    publishInput: {
      businessId: "biz",
      category: "ORDERS",
      title: "New Order",
      body: "Order received",
      triggeredByModule: "orders",
      recipientUserIds: ["user-1"],
    },
    rules,
    preferences: [
      {
        userId: "user-1",
        enabledChannels: ["IN_APP", "EMAIL"],
        disabledCategories: [],
        quietHoursStart: null,
        quietHoursEnd: null,
        language: "en",
        digestFrequency: "DAILY",
      },
    ],
    template: null,
  });
  assert(plan.channels.includes("IN_APP"), "Plan channels missing IN_APP");
  console.log("  PASS");

  console.log("Categories");
  assert(NOTIFICATION_CATEGORIES.length === 12, "Expected 12 notification categories");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  assert(business, "No business found for integration tests");
  const platform = await buildPlatformContext(business.id);

  console.log("Notification defaults");
  await ensureNotificationDefaults(business.id);
  const templates = await listNotificationTemplates(business.id);
  assert(templates.length >= 2, "Default templates not seeded");
  console.log("  PASS");

  console.log("Publish notification");
  const published = await publishNotificationEvent({
    businessId: business.id,
    category: "ORDERS",
    title: "Test Order Notification",
    body: "Your order #1234 is confirmed.",
    triggeredByModule: "verify-notifications",
    triggeredByUserId: platform.user.id,
    recipientUserIds: [platform.user.id],
    templateSlug: "order-created",
    templateVariables: { orderNumber: "1234", customerName: "Test Customer" },
  });
  assert(published.notificationId, "Notification not created");
  assert(published.deliveryIds.length > 0, "Deliveries not created");
  console.log("  PASS");

  console.log("Inbox");
  const inbox = await listNotificationInbox(platform);
  assert(inbox.length > 0, "Inbox items missing");
  const inboxItem = inbox[0];
  assert(inboxItem, "Inbox item missing");
  await markInboxItemRead(platform, inboxItem.id);
  console.log("  PASS");

  console.log("Bulk inbox actions");
  const unreadItems = await listNotificationInbox(platform, { status: "UNREAD" });
  if (unreadItems.length > 0) {
    const count = await bulkInboxAction(platform, {
      inboxItemIds: unreadItems.map((item) => item.id),
      action: "read",
    });
    assert(count > 0, "Bulk read failed");
  }
  console.log("  PASS");

  console.log("Delivery tracking");
  const deliveries = await listNotificationDeliveries(business.id);
  assert(deliveries.length > 0, "Deliveries missing");
  const delivery = deliveries[0];
  assert(delivery, "Delivery record missing");
  await trackDeliveryEngagement(delivery.id, "open");
  await trackDeliveryEngagement(delivery.id, "click");
  console.log("  PASS");

  console.log("Templates");
  const template = await createNotificationTemplate(platform, {
    slug: "verify-test",
    templateType: "IN_APP",
    category: "SYSTEM",
    name: "Verify Test Template",
    body: "Hello {{name}}",
    variables: [{ key: "name", description: "Name", required: true }],
  });
  assert(template.id, "Template creation failed");
  console.log("  PASS");

  console.log("Delivery rules");
  const rule = await createNotificationDeliveryRule(platform, {
    name: "Verify High Priority Orders",
    mode: "IMMEDIATE",
    priority: "HIGH",
    category: "ORDERS",
    channel: "IN_APP",
  });
  assert(rule.id, "Delivery rule creation failed");
  console.log("  PASS");

  console.log("User preferences");
  const prefs = await updateNotificationUserPreferences(platform, {
    language: "en",
    digestFrequency: "DAILY",
    enabledChannels: ["IN_APP", "EMAIL"],
    disabledCategories: ["MARKETING"],
  });
  assert(prefs.id, "Preferences update failed");
  console.log("  PASS");

  console.log("Notification dashboard");
  const dashboard = await getNotificationDashboard(business.id);
  assert(dashboard.totalNotifications > 0, "Dashboard total notifications missing");
  assert(dashboard.templates >= 2, "Dashboard templates count wrong");
  console.log("  PASS");

  console.log("Audit logs");
  const auditLogs = await listNotificationAuditLogs(business.id);
  assert(
    auditLogs.some((log) => log.eventType === "PUBLISHED"),
    "Publish audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "DELIVERED" || log.eventType === "QUEUED"),
    "Delivery audit missing",
  );
  console.log("  PASS");

  console.log("Extensibility registry");
  assert(
    channels.some((c) => c.channel === "TEAMS"),
    "Teams channel not registered",
  );
  assert(
    channels.some((c) => c.channel === "DISCORD"),
    "Discord channel not registered",
  );
  console.log("  PASS");

  console.log("Communication providers");
  const providerResults = await verifyCommunicationProviders();
  logProviderVerificationResults(providerResults);
  assert(
    providerResults.every((result) => result.status === "PASS" || result.status === "SKIP"),
    "provider verification returned unexpected failure",
  );
  console.log("  PASS");

  console.log("\nUnified Notification Hub verification passed.");
}

main()
  .catch(handleVerificationError)
  .finally(async () => {
    await prisma.$disconnect();
  });
