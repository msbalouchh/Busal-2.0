export const PLATFORM_SKILL_SLUGS = {
  CUSTOMER_LOOKUP: "skill.customer-lookup",
  RESERVATION_BOOK: "skill.reservation-book",
  MENU_BROWSE: "skill.menu-browse",
  ORDER_TRACK: "skill.order-track",
  KITCHEN_MONITOR: "skill.kitchen-monitor",
  POS_CHECKOUT: "skill.pos-checkout",
  INVENTORY_CHECK: "skill.inventory-check",
  FINANCE_SUMMARY: "skill.finance-summary",
  MARKETING_CAMPAIGN: "skill.marketing-campaign",
  ANALYTICS_INSIGHT: "skill.analytics-insight",
  NOTIFY_STAFF: "skill.notify-staff",
} as const;

export type PlatformSkillSlug = (typeof PLATFORM_SKILL_SLUGS)[keyof typeof PLATFORM_SKILL_SLUGS];
