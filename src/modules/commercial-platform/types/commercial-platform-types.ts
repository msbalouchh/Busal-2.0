import type { SalesLeadSource, SalesLeadStatus } from "@prisma/client";

import type { ContractsDashboardData } from "@/services/contracts.service";
import type { CustomerSuccessDashboardData } from "@/services/customer-success.service";
import type { ImplementationDashboardData } from "@/services/implementation-delivery.service";
import type { QuotesDashboardData } from "@/services/quotes-proposals.service";
import type { RevopsDashboardData } from "@/services/revops.service";
import type {
  SalesActivityData,
  SalesDashboardData,
  SalesLeadData,
} from "@/services/sales-crm.service";

export interface CommercialPlatformPermissions {
  canViewCrm: boolean;
  canManageCrm: boolean;
  canViewLeads: boolean;
  canManageLeads: boolean;
  canViewCustomers: boolean;
  canViewQuotes: boolean;
  canManageQuotes: boolean;
  canViewContracts: boolean;
  canManageContracts: boolean;
  canViewProjects: boolean;
  canManageProjects: boolean;
  canViewCustomerSuccess: boolean;
  canManageCustomerSuccess: boolean;
  canViewRevenue: boolean;
  canManageRevenue: boolean;
  canViewCatalogue: boolean;
}

export interface CommercialDashboardWidgets {
  totalCustomers: number;
  openLeads: number;
  openOpportunityValuePence: number;
  sentQuotes: number;
  activeContracts: number;
  inProgressProjects: number;
  atRiskAccounts: number;
  outstandingRevenuePence: number;
  mrrPence: number;
  arrPence: number;
}

export interface CommercialPlatformBundle {
  permissions: CommercialPlatformPermissions;
  widgets: CommercialDashboardWidgets;
  sales: SalesDashboardData | null;
  crm: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    vipCustomers: number;
  } | null;
  quotes: QuotesDashboardData | null;
  contracts: ContractsDashboardData | null;
  projects: ImplementationDashboardData | null;
  customerSuccess: CustomerSuccessDashboardData | null;
  revenue: RevopsDashboardData | null;
  recentActivities: SalesActivityData[];
}

export interface LeadDirectoryQuery {
  search?: string;
  status?: SalesLeadStatus;
  source?: SalesLeadSource;
  assignedStaffId?: string | null;
  page?: number;
  pageSize?: number;
}

export interface LeadDirectoryResult {
  items: SalesLeadData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UpdateCommercialLeadInput {
  leadId: string;
  status?: SalesLeadStatus;
  assignedStaffId?: string | null;
  notes?: string | null;
}
