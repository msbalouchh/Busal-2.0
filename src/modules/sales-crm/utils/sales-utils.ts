import { formatMoneyPence } from "@/modules/payments/utils/currency";
import type {
  SalesActivityData,
  SalesCompanyData,
  SalesContactData,
  SalesDashboardData,
  SalesDemoData,
  SalesLeadData,
  SalesOpportunityData,
  SalesPipelineData,
  SalesTaskData,
} from "@/services/sales-crm.service";

export function formatSalesMoney(pence: number): string {
  return formatMoneyPence(pence);
}

export type SalesDashboardView = SalesDashboardData;
export type SalesPipelineView = SalesPipelineData;
export type SalesCompanyView = SalesCompanyData;
export type SalesContactView = SalesContactData;
export type SalesLeadView = SalesLeadData;
export type SalesOpportunityView = SalesOpportunityData;
export type SalesActivityView = SalesActivityData;
export type SalesTaskView = SalesTaskData;
export type SalesDemoView = SalesDemoData;

export function serializeSalesDashboard(dashboard: SalesDashboardData): SalesDashboardView {
  return dashboard;
}

export function serializeSalesPipeline(pipeline: SalesPipelineData): SalesPipelineView {
  return pipeline;
}

export function serializeSalesOpportunity(opportunity: SalesOpportunityData): SalesOpportunityView {
  return opportunity;
}
