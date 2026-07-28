import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeSalesDashboard,
  serializeSalesPipeline,
} from "@/modules/sales-crm/utils/sales-utils";
import {
  ensureDefaultSalesPipeline,
  getActivityTimeline,
  getSalesDashboard,
  listSalesCompanies,
  listSalesContacts,
  listSalesDemos,
  listSalesLeads,
  listSalesOpportunities,
  listSalesPipelines,
  listSalesTasks,
} from "@/services/sales-crm.service";

export const getSalesOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SALES_VIEW });
  const dashboard = await getSalesDashboard(context.business.id);

  return {
    context,
    dashboard: serializeSalesDashboard(dashboard),
  };
});

export const getSalesPipelineContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SALES_VIEW });
  const [pipelines, opportunities] = await Promise.all([
    listSalesPipelines(context.business.id),
    listSalesOpportunities(context.business.id),
  ]);

  return {
    context,
    pipelines: pipelines.map(serializeSalesPipeline),
    opportunities,
  };
});

export const getSalesLeadsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SALES_VIEW });
  const leads = await listSalesLeads(context.business.id);

  return { context, leads };
});

export const getSalesCompaniesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SALES_VIEW });
  const companies = await listSalesCompanies(context.business.id);

  return { context, companies };
});

export const getSalesContactsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SALES_VIEW });
  const [contacts, companies] = await Promise.all([
    listSalesContacts(context.business.id),
    listSalesCompanies(context.business.id),
  ]);

  return { context, contacts, companies };
});

export const getSalesOpportunitiesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SALES_VIEW });
  const [opportunities, pipeline] = await Promise.all([
    listSalesOpportunities(context.business.id),
    ensureDefaultSalesPipeline(context.business.id),
  ]);

  return {
    context,
    opportunities,
    pipeline: serializeSalesPipeline(pipeline),
  };
});

export const getSalesActivitiesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SALES_VIEW });
  const activities = await getActivityTimeline(context.business.id);

  return { context, activities };
});

export const getSalesTasksContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SALES_VIEW });
  const tasks = await listSalesTasks(context.business.id);

  return { context, tasks };
});

export const getSalesDemosContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SALES_VIEW });
  const demos = await listSalesDemos(context.business.id);

  return { context, demos };
});
