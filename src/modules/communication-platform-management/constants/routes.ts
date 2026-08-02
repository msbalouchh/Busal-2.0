import type {
  PlatformCampaignStatus,
  PlatformChannelStatus,
  PlatformChannelType,
  PlatformMessageDirection,
  PlatformMessageStatus,
  PlatformTemplateStatus,
} from "@prisma/client";

export const COMMUNICATION_PLATFORM_ROUTES = {
  dashboard: () => `/app/communications`,
  inbox: () => `/app/communications/inbox`,
  templates: () => `/app/communications/templates`,
  campaigns: () => `/app/communications/campaigns`,
  logs: () => `/app/communications/logs`,
  analytics: () => `/app/communications/analytics`,
  channels: () => `/app/communications/channels`,
  search: () => `/app/communications/search`,
} as const;

export const COMMUNICATION_PLATFORM_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: COMMUNICATION_PLATFORM_ROUTES.dashboard() },
  { id: "inbox", label: "Inbox", href: COMMUNICATION_PLATFORM_ROUTES.inbox() },
  { id: "templates", label: "Templates", href: COMMUNICATION_PLATFORM_ROUTES.templates() },
  { id: "campaigns", label: "Campaigns", href: COMMUNICATION_PLATFORM_ROUTES.campaigns() },
  { id: "logs", label: "Delivery Logs", href: COMMUNICATION_PLATFORM_ROUTES.logs() },
  { id: "analytics", label: "Analytics", href: COMMUNICATION_PLATFORM_ROUTES.analytics() },
  { id: "channels", label: "Channels", href: COMMUNICATION_PLATFORM_ROUTES.channels() },
  { id: "search", label: "Search", href: COMMUNICATION_PLATFORM_ROUTES.search() },
] as const;

export const CHANNEL_TYPE_OPTIONS: Array<{ value: PlatformChannelType; label: string }> = [
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "PUSH", label: "Push" },
  { value: "IN_APP", label: "In-App" },
  { value: "VOICE", label: "Voice" },
  { value: "WEBHOOK", label: "Webhook" },
];

export const MESSAGE_STATUS_OPTIONS: Array<{
  value: PlatformMessageStatus | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "All statuses" },
  { value: "QUEUED", label: "Queued" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SENT", label: "Sent" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "READ", label: "Read" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const CHANNEL_STATUS_OPTIONS: Array<{ value: PlatformChannelStatus; label: string }> = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ERROR", label: "Error" },
];

export const TEMPLATE_STATUS_OPTIONS: Array<{ value: PlatformTemplateStatus; label: string }> = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
];

export const CAMPAIGN_STATUS_OPTIONS: Array<{ value: PlatformCampaignStatus; label: string }> = [
  { value: "DRAFT", label: "Draft" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "RUNNING", label: "Running" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const DIRECTION_OPTIONS: Array<{ value: PlatformMessageDirection; label: string }> = [
  { value: "OUTBOUND", label: "Outbound" },
  { value: "INBOUND", label: "Inbound" },
];
