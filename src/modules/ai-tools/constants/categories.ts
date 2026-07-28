import type { AiToolCategory } from "@prisma/client";

export const AI_TOOL_CATEGORIES: AiToolCategory[] = [
  "CRM",
  "RESTAURANT",
  "POS",
  "ORDERS",
  "RESERVATIONS",
  "INVENTORY",
  "REPORTING",
  "STAFF",
  "COMMERCIAL",
  "REVENUE",
  "AI",
  "MARKETING",
  "FINANCE",
  "ADMINISTRATION",
];

export const AI_TOOL_CATEGORY_LABELS: Record<AiToolCategory, string> = {
  CRM: "CRM",
  RESTAURANT: "Restaurant",
  POS: "POS",
  ORDERS: "Orders",
  RESERVATIONS: "Reservations",
  INVENTORY: "Inventory",
  REPORTING: "Reporting",
  STAFF: "Staff",
  COMMERCIAL: "Commercial",
  REVENUE: "Revenue",
  AI: "AI",
  MARKETING: "Marketing",
  FINANCE: "Finance",
  ADMINISTRATION: "Administration",
};
