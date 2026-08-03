export const CUSTOMER_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PROSPECT: "prospect",
  VIP: "vip",
  BLOCKED: "blocked",
} as const;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[keyof typeof CUSTOMER_STATUSES];

export const TIMELINE_EVENT_TYPES = {
  CREATED: "created",
  ORDER: "order",
  RESERVATION: "reservation",
  NOTE: "note",
  COMMUNICATION: "communication",
  LOYALTY: "loyalty",
  SEGMENT: "segment",
  PAYMENT: "payment",
  AI_INSIGHT: "ai-insight",
} as const;

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[keyof typeof TIMELINE_EVENT_TYPES];

export const COMMUNICATION_CHANNELS = {
  EMAIL: "email",
  SMS: "sms",
  PHONE: "phone",
  IN_APP: "in-app",
  WHATSAPP: "whatsapp",
} as const;

export type CommunicationChannel =
  (typeof COMMUNICATION_CHANNELS)[keyof typeof COMMUNICATION_CHANNELS];

export const MEMBERSHIP_TIERS = {
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  PLATINUM: "platinum",
} as const;

export type MembershipTier = (typeof MEMBERSHIP_TIERS)[keyof typeof MEMBERSHIP_TIERS];

export const CRM_AI_TOOL_IDS = {
  SEARCH: "crm.search-customer",
  CREATE: "crm.create-customer",
  UPDATE: "crm.update-customer",
  VIEW_HISTORY: "crm.view-customer-history",
  GENERATE_INSIGHTS: "crm.generate-customer-insights",
  RECOMMEND_MARKETING: "crm.recommend-marketing-actions",
} as const;

export type CrmAiToolId = (typeof CRM_AI_TOOL_IDS)[keyof typeof CRM_AI_TOOL_IDS];
