import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import { PLATFORM_MODULES } from "@/modules/ai-tools/constants/platform-tools";
import { registerPlatformTool } from "@/modules/ai-tools/registry/platform-tool-registry";
import type { RegisteredPlatformTool } from "@/modules/ai-tools/types/platform-tool";
import {
  detectNotificationFailuresForAi,
  generateNotificationForAi,
  generateTemplatesForAi,
  optimizeSendTimeForAi,
  predictDeliveryForAi,
  recommendChannelForAi,
  scheduleNotificationForAi,
  summarizeNotificationsForAi,
} from "@/modules/notifications/ai/notification-ai-context";
import {
  NOTIFICATION_AI_TOOL_IDS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_SOURCES,
  NOTIFICATION_PERMISSIONS,
} from "@/modules/notifications/constants/notification-status";
import type {
  NotificationChannel,
  NotificationEventSource,
} from "@/modules/notifications/constants/notification-status";

function defineNotificationTool(
  partial: Omit<RegisteredPlatformTool, "handler" | "version" | "isEnabled" | "metadata"> & {
    metadata?: Partial<RegisteredPlatformTool["metadata"]>;
  },
  handler: RegisteredPlatformTool["handler"],
): RegisteredPlatformTool {
  return {
    ...partial,
    version: "1.0.0",
    isEnabled: true,
    metadata: {
      category: "Notifications",
      tags: ["notifications", "messaging", "alerts"],
      readOnly: false,
      confirmationRequired: false,
      dryRunSupported: true,
      riskLevel: "low",
      ...partial.metadata,
    },
    handler,
  };
}

const NOTIFICATION_AGENT_SLUGS = [
  BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
  BUILTIN_AGENT_SLUGS.OPERATIONS,
  BUILTIN_AGENT_SLUGS.ANALYTICS,
];

const ALL_CHANNELS = Object.values(NOTIFICATION_CHANNELS);
const ALL_EVENT_SOURCES = Object.values(NOTIFICATION_EVENT_SOURCES);

function parseChannel(value: unknown): NotificationChannel | undefined {
  if (typeof value === "string" && ALL_CHANNELS.includes(value as NotificationChannel)) {
    return value as NotificationChannel;
  }
  return undefined;
}

function parseEventSource(value: unknown): NotificationEventSource | undefined {
  if (typeof value === "string" && ALL_EVENT_SOURCES.includes(value as NotificationEventSource)) {
    return value as NotificationEventSource;
  }
  return undefined;
}

export const NOTIFICATION_AI_TOOLS: RegisteredPlatformTool[] = [
  defineNotificationTool(
    {
      id: NOTIFICATION_AI_TOOL_IDS.GENERATE_NOTIFICATION,
      name: "Generate Notification",
      description: "Generate and queue a new notification.",
      requiredPermissions: [NOTIFICATION_PERMISSIONS.SEND],
      requiredModules: [PLATFORM_MODULES.NOTIFICATIONS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["title", "body"],
        properties: {
          title: { type: "string" },
          body: { type: "string" },
          channel: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: NOTIFICATION_AGENT_SLUGS,
      capabilityId: "capability.notifications",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) =>
      generateNotificationForAi({
        title: typeof input.title === "string" ? input.title : "Notification",
        body: typeof input.body === "string" ? input.body : "",
        channel: parseChannel(input.channel),
      }),
  ),
  defineNotificationTool(
    {
      id: NOTIFICATION_AI_TOOL_IDS.RECOMMEND_CHANNEL,
      name: "Recommend Channel",
      description: "Recommend the optimal delivery channel for an event.",
      requiredPermissions: [NOTIFICATION_PERMISSIONS.READ],
      requiredModules: [PLATFORM_MODULES.NOTIFICATIONS, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        properties: {
          eventSource: { type: "string" },
          priority: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: NOTIFICATION_AGENT_SLUGS,
      capabilityId: "capability.notifications",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) =>
      recommendChannelForAi({
        eventSource: parseEventSource(input.eventSource),
        priority: typeof input.priority === "string" ? input.priority : undefined,
      }),
  ),
  defineNotificationTool(
    {
      id: NOTIFICATION_AI_TOOL_IDS.SCHEDULE_NOTIFICATION,
      name: "Schedule Notification",
      description: "Schedule a notification for future delivery.",
      requiredPermissions: [NOTIFICATION_PERMISSIONS.SEND],
      requiredModules: [PLATFORM_MODULES.NOTIFICATIONS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["title", "body", "scheduledAt"],
        properties: {
          title: { type: "string" },
          body: { type: "string" },
          scheduledAt: { type: "string" },
          channel: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: NOTIFICATION_AGENT_SLUGS,
      capabilityId: "capability.notifications",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) =>
      scheduleNotificationForAi({
        title: typeof input.title === "string" ? input.title : "Scheduled Notification",
        body: typeof input.body === "string" ? input.body : "",
        scheduledAt:
          typeof input.scheduledAt === "string" ? input.scheduledAt : new Date().toISOString(),
        channel: parseChannel(input.channel),
      }),
  ),
  defineNotificationTool(
    {
      id: NOTIFICATION_AI_TOOL_IDS.PREDICT_DELIVERY,
      name: "Predict Delivery",
      description: "Predict delivery success rate and timing for a channel.",
      requiredPermissions: [NOTIFICATION_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [PLATFORM_MODULES.NOTIFICATIONS, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        properties: { channel: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.notifications",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => predictDeliveryForAi({ channel: parseChannel(input.channel) }),
  ),
  defineNotificationTool(
    {
      id: NOTIFICATION_AI_TOOL_IDS.DETECT_FAILURES,
      name: "Detect Notification Failures",
      description: "Detect failed deliveries and pending retries.",
      requiredPermissions: [NOTIFICATION_PERMISSIONS.READ],
      requiredModules: [PLATFORM_MODULES.NOTIFICATIONS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: NOTIFICATION_AGENT_SLUGS,
      capabilityId: "capability.notifications",
      skillIds: [],
      metadata: { readOnly: true, riskLevel: "medium" },
    },
    async () => detectNotificationFailuresForAi(),
  ),
  defineNotificationTool(
    {
      id: NOTIFICATION_AI_TOOL_IDS.OPTIMIZE_SEND_TIME,
      name: "Optimize Send Time",
      description: "Recommend optimal send times by channel.",
      requiredPermissions: [NOTIFICATION_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [PLATFORM_MODULES.NOTIFICATIONS, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.notifications",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => optimizeSendTimeForAi(),
  ),
  defineNotificationTool(
    {
      id: NOTIFICATION_AI_TOOL_IDS.SUMMARIZE,
      name: "Summarize Notifications",
      description: "Summarize unread and recent notifications.",
      requiredPermissions: [NOTIFICATION_PERMISSIONS.READ],
      requiredModules: [PLATFORM_MODULES.NOTIFICATIONS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: NOTIFICATION_AGENT_SLUGS,
      capabilityId: "capability.notifications",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => summarizeNotificationsForAi(),
  ),
  defineNotificationTool(
    {
      id: NOTIFICATION_AI_TOOL_IDS.GENERATE_TEMPLATES,
      name: "Generate Templates",
      description: "Generate notification templates for an event type.",
      requiredPermissions: [NOTIFICATION_PERMISSIONS.TEMPLATE],
      requiredModules: [PLATFORM_MODULES.NOTIFICATIONS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        properties: {
          eventSource: { type: "string" },
          eventKey: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: NOTIFICATION_AGENT_SLUGS,
      capabilityId: "capability.notifications",
      skillIds: [],
      metadata: { confirmationRequired: true },
    },
    async (input) =>
      generateTemplatesForAi({
        eventSource: parseEventSource(input.eventSource),
        eventKey: typeof input.eventKey === "string" ? input.eventKey : undefined,
      }),
  ),
];

let registered = false;

/** Registers Notification platform tools with the AI Tool Platform (mock, idempotent). */
export function registerNotificationAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of NOTIFICATION_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}
