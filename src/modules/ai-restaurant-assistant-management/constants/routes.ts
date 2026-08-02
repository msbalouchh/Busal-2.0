export const AI_RESTAURANT_ASSISTANT_ROUTES = {
  dashboard: () => `/app/restaurant/assistant`,
  chat: (conversationId?: string) =>
    conversationId
      ? `/app/restaurant/assistant/chat?conversationId=${conversationId}`
      : `/app/restaurant/assistant/chat`,
  recommendations: () => `/app/restaurant/assistant/recommendations`,
  insights: () => `/app/restaurant/assistant/insights`,
} as const;

export const SUGGESTED_PROMPTS = [
  "What were today's sales?",
  "Show today's reservations.",
  "What are the busiest hours?",
  "Which products sell the most?",
  "Which inventory items are low?",
  "Which customers visit most?",
  "Which staff handled the most orders?",
  "Summarize today's business.",
] as const;

export const INSIGHT_CATEGORIES = [
  { id: "sales", label: "Sales" },
  { id: "orders", label: "Orders" },
  { id: "reservations", label: "Reservations" },
  { id: "customers", label: "Customers" },
  { id: "inventory", label: "Inventory" },
  { id: "kitchen", label: "Kitchen" },
  { id: "staff", label: "Staff" },
  { id: "revenue", label: "Revenue" },
] as const;

export const SUMMARY_PERIODS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
] as const;
