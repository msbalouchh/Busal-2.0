import "server-only";

import type { AnalyticsFilters } from "@/modules/restaurant-analytics-management/types/restaurant-analytics-types";
import { defaultDateRange } from "@/modules/restaurant-analytics-management/lib/restaurant-analytics-validation";
import {
  getCustomersDashboard,
  getExecutiveDashboard,
  getInventoryDashboard,
  getKitchenDashboard,
  getOrdersDashboard,
  getPaymentsDashboard,
  getProductsDashboard,
  getReservationsDashboard,
  getSalesDashboard,
  getStaffDashboard,
} from "@/services/restaurant-analytics.service";
import type { InsightCard } from "@/modules/ai-restaurant-assistant-management/types/ai-restaurant-assistant-types";

export type RestaurantIntent =
  | "sales_today"
  | "sales_weekly"
  | "sales_monthly"
  | "reservations_today"
  | "peak_hours"
  | "top_products"
  | "worst_products"
  | "low_inventory"
  | "top_customers"
  | "staff_performance"
  | "kitchen_status"
  | "business_summary"
  | "payments_summary"
  | "revenue_insights"
  | "reorder_suggestions"
  | "general";

interface IntentMatch {
  intent: RestaurantIntent;
  confidence: number;
}

const INTENT_PATTERNS: Array<{ intent: RestaurantIntent; patterns: RegExp[] }> = [
  { intent: "sales_today", patterns: [/today.*sales|sales.*today|what were today/i] },
  { intent: "sales_weekly", patterns: [/weekly sales|this week.*sales|week summary/i] },
  { intent: "sales_monthly", patterns: [/monthly sales|this month.*sales|month summary/i] },
  { intent: "reservations_today", patterns: [/today.*reserv|reserv.*today|show.*reserv/i] },
  { intent: "peak_hours", patterns: [/busiest hour|peak hour|busy hours/i] },
  { intent: "top_products", patterns: [/sell the most|top product|best selling/i] },
  { intent: "worst_products", patterns: [/underperform|worst selling|slowest product/i] },
  { intent: "low_inventory", patterns: [/low stock|inventory.*low|reorder/i] },
  { intent: "top_customers", patterns: [/visit most|top customer|best customer/i] },
  { intent: "staff_performance", patterns: [/staff.*order|most orders.*staff|staff performance/i] },
  { intent: "kitchen_status", patterns: [/kitchen|prep time|preparation/i] },
  { intent: "business_summary", patterns: [/summarize|summary|overview|health/i] },
  { intent: "payments_summary", patterns: [/payment|refund|collected/i] },
  { intent: "revenue_insights", patterns: [/revenue|profit|gross|net/i] },
  { intent: "reorder_suggestions", patterns: [/what should i reorder|reorder this week/i] },
];

export function detectRestaurantIntent(message: string): IntentMatch {
  const normalized = message.trim().toLowerCase();

  for (const entry of INTENT_PATTERNS) {
    if (entry.patterns.some((pattern) => pattern.test(normalized))) {
      return { intent: entry.intent, confidence: 0.9 };
    }
  }

  return { intent: "general", confidence: 0.3 };
}

function filtersForPeriod(
  period: "daily" | "weekly" | "monthly",
  branchId?: string | null,
): AnalyticsFilters {
  const range = defaultDateRange(period === "daily" ? 1 : period === "weekly" ? 7 : 30);
  return { branchId: branchId ?? null, dateRange: range };
}

function todayFilters(branchId?: string | null): AnalyticsFilters {
  return filtersForPeriod("daily", branchId);
}

export async function composeRestaurantAssistantReply(
  ownerId: string,
  message: string,
  branchId?: string | null,
): Promise<{ content: string; intent: RestaurantIntent; insightCards: InsightCard[] }> {
  const { intent } = detectRestaurantIntent(message);
  const filters = todayFilters(branchId);
  const insightCards: InsightCard[] = [];

  switch (intent) {
    case "sales_today":
    case "revenue_insights": {
      const sales = await getSalesDashboard(ownerId, filters);
      insightCards.push(
        ...sales.kpis.map((kpi, index) => ({
          id: `sales-${index}`,
          category: "sales",
          title: kpi.label,
          value: kpi.value,
          hint: kpi.hint,
        })),
      );
      return {
        intent,
        insightCards,
        content: [
          "## Sales insights",
          ...sales.kpis.map((kpi) => `- **${kpi.label}:** ${kpi.value}`),
          "",
          `_Based on paid orders from ${filters.dateRange.from} to ${filters.dateRange.to}._`,
        ].join("\n"),
      };
    }
    case "sales_weekly": {
      const sales = await getSalesDashboard(ownerId, filtersForPeriod("weekly", branchId));
      return {
        intent,
        insightCards: sales.kpis.map((kpi, index) => ({
          id: `weekly-${index}`,
          category: "sales",
          title: kpi.label,
          value: kpi.value,
        })),
        content: `## Weekly sales summary\n\n${sales.kpis.map((kpi) => `- **${kpi.label}:** ${kpi.value}`).join("\n")}`,
      };
    }
    case "sales_monthly": {
      const sales = await getSalesDashboard(ownerId, filtersForPeriod("monthly", branchId));
      return {
        intent,
        insightCards: sales.kpis.map((kpi, index) => ({
          id: `monthly-${index}`,
          category: "sales",
          title: kpi.label,
          value: kpi.value,
        })),
        content: `## Monthly sales summary\n\n${sales.kpis.map((kpi) => `- **${kpi.label}:** ${kpi.value}`).join("\n")}`,
      };
    }
    case "reservations_today": {
      const data = await getReservationsDashboard(ownerId, filters);
      return {
        intent,
        insightCards: data.kpis.map((kpi, index) => ({
          id: `res-${index}`,
          category: "reservations",
          title: kpi.label,
          value: kpi.value,
        })),
        content: [
          "## Today's reservations",
          ...data.kpis.map((kpi) => `- **${kpi.label}:** ${kpi.value}`),
          data.byStatus.length
            ? `\n**By status:** ${data.byStatus.map((entry) => `${entry.label} (${entry.value})`).join(", ")}`
            : "",
        ].join("\n"),
      };
    }
    case "peak_hours": {
      const orders = await getOrdersDashboard(ownerId, filters);
      const topHours = [...orders.ordersByHour].sort((a, b) => b.value - a.value).slice(0, 5);
      return {
        intent,
        insightCards: topHours.map((entry, index) => ({
          id: `hour-${index}`,
          category: "orders",
          title: entry.label,
          value: String(entry.value),
          hint: "orders",
        })),
        content: [
          "## Peak hours",
          ...topHours.map(
            (entry, index) => `${index + 1}. **${entry.label}** — ${entry.value} orders`,
          ),
        ].join("\n"),
      };
    }
    case "top_products": {
      const products = await getProductsDashboard(ownerId, filters);
      const rows = products.topSelling.slice(0, 5);
      return {
        intent,
        insightCards: rows.map((row, index) => ({
          id: `product-${index}`,
          category: "products",
          title: row.cells[0] ?? "Product",
          value: row.cells[1] ?? "0",
          hint: row.cells[2] ?? undefined,
        })),
        content: [
          "## Top selling products",
          ...rows.map(
            (row, index) =>
              `${index + 1}. **${row.cells[0]}** — ${row.cells[1]} sold (${row.cells[2]})`,
          ),
        ].join("\n"),
      };
    }
    case "worst_products": {
      const products = await getProductsDashboard(ownerId, filters);
      const rows = products.worstSelling.slice(0, 5);
      return {
        intent,
        insightCards: [],
        content: [
          "## Underperforming products",
          ...rows.map(
            (row, index) =>
              `${index + 1}. **${row.cells[0]}** — ${row.cells[1]} sold (${row.cells[2]})`,
          ),
        ].join("\n"),
      };
    }
    case "low_inventory":
    case "reorder_suggestions": {
      const inventory = await getInventoryDashboard(ownerId, filters);
      const rows = inventory.lowStockItems.slice(0, 8);
      return {
        intent,
        insightCards: inventory.kpis.map((kpi, index) => ({
          id: `inv-${index}`,
          category: "inventory",
          title: kpi.label,
          value: kpi.value,
        })),
        content: [
          intent === "reorder_suggestions" ? "## Reorder suggestions" : "## Low stock items",
          ...inventory.kpis.map((kpi) => `- **${kpi.label}:** ${kpi.value}`),
          rows.length
            ? `\n**Items to review:**\n${rows.map((row) => `- ${row.cells[0]} (${row.cells[1]}) — stock: ${row.cells[2]}`).join("\n")}`
            : "\nNo low-stock items detected for the selected period.",
        ].join("\n"),
      };
    }
    case "top_customers": {
      const customers = await getCustomersDashboard(ownerId, filters);
      return {
        intent,
        insightCards: customers.kpis.map((kpi, index) => ({
          id: `cust-${index}`,
          category: "customers",
          title: kpi.label,
          value: kpi.value,
        })),
        content: [
          "## Customer insights",
          ...customers.kpis.map((kpi) => `- **${kpi.label}:** ${kpi.value}`),
          customers.topSpenders.length
            ? `\n**Top spenders:**\n${customers.topSpenders
                .slice(0, 5)
                .map(
                  (row, index) =>
                    `${index + 1}. ${row.cells[0]} — ${row.cells[2]} (${row.cells[1]} orders)`,
                )
                .join("\n")}`
            : "",
        ].join("\n"),
      };
    }
    case "staff_performance": {
      const staff = await getStaffDashboard(ownerId, filters);
      return {
        intent,
        insightCards: [],
        content: [
          "## Staff performance",
          staff.performance.length
            ? staff.performance
                .slice(0, 8)
                .map(
                  (row, index) =>
                    `${index + 1}. **${row.cells[0]}** — ${row.cells[1]} orders, ${row.cells[2]} revenue`,
                )
                .join("\n")
            : "No staff-attributed orders found for this period.",
        ].join("\n"),
      };
    }
    case "kitchen_status": {
      const kitchen = await getKitchenDashboard(ownerId, filters);
      return {
        intent,
        insightCards: kitchen.kpis.map((kpi, index) => ({
          id: `kitchen-${index}`,
          category: "kitchen",
          title: kpi.label,
          value: kpi.value,
        })),
        content: [
          "## Kitchen insights",
          ...kitchen.kpis.map((kpi) => `- **${kpi.label}:** ${kpi.value}`),
          kitchen.ordersByStatus.length
            ? `\n**By status:** ${kitchen.ordersByStatus.map((entry) => `${entry.label} (${entry.value})`).join(", ")}`
            : "",
        ].join("\n"),
      };
    }
    case "payments_summary": {
      const payments = await getPaymentsDashboard(ownerId, filters);
      return {
        intent,
        insightCards: payments.kpis.map((kpi, index) => ({
          id: `pay-${index}`,
          category: "payments",
          title: kpi.label,
          value: kpi.value,
        })),
        content: payments.kpis.map((kpi) => `- **${kpi.label}:** ${kpi.value}`).join("\n"),
      };
    }
    case "business_summary": {
      const executive = await getExecutiveDashboard(ownerId, filters);
      return {
        intent,
        insightCards: executive.kpis.map((kpi, index) => ({
          id: `exec-${index}`,
          category: "revenue",
          title: kpi.label,
          value: kpi.value,
        })),
        content: [
          "## Business summary",
          ...executive.kpis.map((kpi) => `- **${kpi.label}:** ${kpi.value}`),
          executive.topProducts.length
            ? `\n**Top products:** ${executive.topProducts
                .slice(0, 3)
                .map((row) => row.cells[0])
                .join(", ")}`
            : "",
        ].join("\n"),
      };
    }
    default:
      return {
        intent: "general",
        insightCards: [],
        content: [
          "I can help with restaurant operations using your live data. Try asking:",
          "",
          "- What were today's sales?",
          "- Show today's reservations",
          "- What are the busiest hours?",
          "- Which products sell the most?",
          "- Which inventory items are low?",
          "- Summarize today's business",
        ].join("\n"),
      };
  }
}

export async function buildBusinessHealthSummary(
  ownerId: string,
  branchId?: string | null,
): Promise<{ score: number; label: string; highlights: InsightCard[]; concerns: string[] }> {
  const filters = todayFilters(branchId);
  const [executive, inventory, orders] = await Promise.all([
    getExecutiveDashboard(ownerId, filters),
    getInventoryDashboard(ownerId, filters),
    getOrdersDashboard(ownerId, filters),
  ]);

  const highlights = executive.kpis.slice(0, 4).map((kpi, index) => ({
    id: `health-${index}`,
    category: "revenue",
    title: kpi.label,
    value: kpi.value,
  }));

  const concerns: string[] = [];
  const lowStockKpi = inventory.kpis.find((kpi) => kpi.label === "Low stock items");
  if (lowStockKpi && Number(lowStockKpi.value) > 0) {
    concerns.push(`${lowStockKpi.value} inventory items are low on stock`);
  }
  if (orders.cancelledOrders > 0) {
    concerns.push(`${orders.cancelledOrders} orders were cancelled today`);
  }

  const score = Math.max(35, Math.min(98, 88 - concerns.length * 12));

  return {
    score,
    label: score >= 80 ? "Healthy" : score >= 60 ? "Needs attention" : "At risk",
    highlights,
    concerns,
  };
}
