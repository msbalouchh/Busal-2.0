export const COMMUNICATION_ROUTES = {
  overview: "/dashboard/communication",
  inbox: "/dashboard/communication/inbox",
  personal: "/dashboard/communication/inbox/personal",
  team: "/dashboard/communication/inbox/team",
  department: "/dashboard/communication/inbox/department",
  ai: "/dashboard/communication/inbox/ai",
  conversations: "/dashboard/communication/inbox",
  channels: "/dashboard/communication/channels",
  search: "/dashboard/communication/search",
  audit: "/dashboard/communication/audit",
} as const;

export const COMMUNICATION_NAV_ITEMS = [
  { label: "Overview", href: COMMUNICATION_ROUTES.overview },
  { label: "Inbox", href: COMMUNICATION_ROUTES.inbox },
  { label: "Personal", href: COMMUNICATION_ROUTES.personal },
  { label: "Team", href: COMMUNICATION_ROUTES.team },
  { label: "Department", href: COMMUNICATION_ROUTES.department },
  { label: "AI Inbox", href: COMMUNICATION_ROUTES.ai },
  { label: "Channels", href: COMMUNICATION_ROUTES.channels },
  { label: "Search", href: COMMUNICATION_ROUTES.search },
  { label: "Audit", href: COMMUNICATION_ROUTES.audit },
] as const;

export const COMMUNICATION_CHANNELS = [
  "EMAIL",
  "WHATSAPP",
  "SMS",
  "LIVE_CHAT",
  "FACEBOOK_MESSENGER",
  "INSTAGRAM_DIRECT",
  "WEB_CONTACT_FORM",
] as const;

export const COMMUNICATION_INBOX_FILTERS = [
  "unread",
  "assigned",
  "waiting_customer",
  "waiting_staff",
  "ai_handled",
  "closed",
] as const;

export const COMMUNICATION_ATTACHMENT_TYPES = [
  "IMAGE",
  "PDF",
  "OFFICE_DOCUMENT",
  "AUDIO",
  "VIDEO",
] as const;

export const AI_CONFIDENCE_ESCALATION_THRESHOLD = 0.6;
