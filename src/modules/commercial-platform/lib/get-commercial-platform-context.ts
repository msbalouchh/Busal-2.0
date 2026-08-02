import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import type { LeadDirectoryQuery } from "@/modules/commercial-platform/types/commercial-platform-types";
import {
  serializeContract,
  serializeContractsDashboard,
} from "@/modules/contracts/utils/contract-utils";
import { serializeCrmDashboard, serializeCustomer } from "@/modules/crm/utils/crm-utils";
import {
  serializeCustomer360Profile,
  serializeCustomerSuccessDashboard,
} from "@/modules/customer-success/utils/customer-success-utils";
import {
  serializeImplementationDashboard,
  serializeImplementationProject,
} from "@/modules/implementation/utils/implementation-utils";
import {
  serializeProposal,
  serializeQuote,
  serializeQuotesDashboard,
} from "@/modules/quotes/utils/quote-utils";
import { serializeRevopsDashboard } from "@/modules/revops/utils/revops-utils";
import {
  serializeSalesDashboard,
  serializeSalesPipeline,
} from "@/modules/sales-crm/utils/sales-utils";
import {
  getCommercialPlatformBundle,
  queryCommercialLeads,
} from "@/services/commercial-platform-module.service";
import { getContractsDashboard, listContracts } from "@/services/contracts.service";
import { getCrmDashboard, listCustomers } from "@/services/crm.service";
import {
  getCustomerSuccessDashboard,
  listCustomer360Profiles,
} from "@/services/customer-success.service";
import {
  getImplementationDashboard,
  listImplementationProjects,
} from "@/services/implementation-delivery.service";
import { getQuotesDashboard, listProposals, listQuotes } from "@/services/quotes-proposals.service";
import { getRevopsDashboard, listRevenueInvoices } from "@/services/revops.service";
import {
  ensureDefaultSalesPipeline,
  getActivityTimeline,
  getSalesDashboard,
  listSalesLeads,
} from "@/services/sales-crm.service";

export const getCommercialPlatformContext = cache(async () => {
  const platform = await protectedPage();
  const bundle = await getCommercialPlatformBundle(platform);

  return {
    platform,
    ...bundle,
  };
});

export const getCommercialCrmContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.CRM_VIEW });
  const [bundle, sales, activities] = await Promise.all([
    getCommercialPlatformBundle(platform),
    getSalesDashboard(platform.business.id),
    getActivityTimeline(platform.business.id),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    sales: serializeSalesDashboard(sales),
    crm: bundle.crm,
    recentActivities: activities.slice(0, 10),
  };
});

export const getCommercialLeadsContext = cache(async (query: LeadDirectoryQuery = {}) => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.SALES_VIEW });
  const [bundle, directory, pipeline, leads] = await Promise.all([
    getCommercialPlatformBundle(platform),
    queryCommercialLeads(platform, query),
    ensureDefaultSalesPipeline(platform.business.id),
    listSalesLeads(platform.business.id),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    directory,
    pipeline: serializeSalesPipeline(pipeline),
    allLeads: leads,
  };
});

export const getCommercialCustomersContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.CRM_VIEW });
  const [bundle, customers, dashboard] = await Promise.all([
    getCommercialPlatformBundle(platform),
    listCustomers(platform.business.id),
    getCrmDashboard(platform.business.id, platform.branchId),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    customers: customers.map(serializeCustomer),
    dashboard: serializeCrmDashboard(dashboard),
  };
});

export const getCommercialQuotesContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.QUOTES_VIEW });
  const [bundle, quotes, proposals, dashboard] = await Promise.all([
    getCommercialPlatformBundle(platform),
    listQuotes(platform.business.id),
    listProposals(platform.business.id),
    getQuotesDashboard(platform.business.id),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    quotes: quotes.map(serializeQuote),
    proposals: proposals.map(serializeProposal),
    dashboard: serializeQuotesDashboard(dashboard),
  };
});

export const getCommercialContractsContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.CONTRACTS_VIEW });
  const [bundle, contracts, dashboard] = await Promise.all([
    getCommercialPlatformBundle(platform),
    listContracts(platform.business.id),
    getContractsDashboard(platform.business.id),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    contracts: contracts.map(serializeContract),
    dashboard: serializeContractsDashboard(dashboard),
  };
});

export const getCommercialProjectsContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.IMPLEMENTATION_VIEW });
  const [bundle, projects, dashboard] = await Promise.all([
    getCommercialPlatformBundle(platform),
    listImplementationProjects(platform.business.id),
    getImplementationDashboard(platform.business.id),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    projects: projects.map(serializeImplementationProject),
    dashboard: serializeImplementationDashboard(dashboard),
  };
});

export const getCommercialCustomerSuccessContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.SUCCESS_VIEW });
  const [bundle, profiles, dashboard] = await Promise.all([
    getCommercialPlatformBundle(platform),
    listCustomer360Profiles(platform.business.id),
    getCustomerSuccessDashboard(platform.business.id),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    profiles: profiles.map(serializeCustomer360Profile),
    dashboard: serializeCustomerSuccessDashboard(dashboard),
  };
});

export const getCommercialRevenueContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.REVENUE_VIEW });
  const [bundle, invoices, dashboard] = await Promise.all([
    getCommercialPlatformBundle(platform),
    listRevenueInvoices(platform.business.id),
    getRevopsDashboard(platform.business.id),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    invoices,
    dashboard: serializeRevopsDashboard(dashboard),
    widgets: bundle.widgets,
  };
});

export const getCommercialModuleContext = getCommercialPlatformContext;
