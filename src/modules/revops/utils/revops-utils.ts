import type { RevopsDashboardData, RevenueInvoiceData } from "@/services/revops.service";

export type RevopsDashboardView = RevopsDashboardData;
export type RevenueInvoiceView = RevenueInvoiceData;

export function serializeRevopsDashboard(dashboard: RevopsDashboardData): RevopsDashboardView {
  return dashboard;
}

export function serializeRevenueInvoice(invoice: RevenueInvoiceData): RevenueInvoiceView {
  return invoice;
}

export function formatRevopsMoney(pence: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(pence / 100);
}
