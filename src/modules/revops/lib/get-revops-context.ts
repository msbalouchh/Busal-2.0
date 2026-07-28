import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeRevopsDashboard,
  serializeRevenueInvoice,
} from "@/modules/revops/utils/revops-utils";
import {
  generateRevenueForecast,
  getProfitabilityReport,
  getRevopsDashboard,
  getRevenueAnalytics,
  listCollectionCases,
  listRevenueExpenses,
  listRevenueInvoices,
  listRevenuePayments,
  listRevenueRecognition,
} from "@/services/revops.service";

export const getRevopsOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.REVENUE_VIEW });
  const dashboard = await getRevopsDashboard(context.business.id);

  return {
    context,
    dashboard: serializeRevopsDashboard(dashboard),
  };
});

export const getRevopsInvoicesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.REVENUE_VIEW });
  const invoices = await listRevenueInvoices(context.business.id);

  return {
    context,
    invoices: invoices.map(serializeRevenueInvoice),
  };
});

export const getRevopsPaymentsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.REVENUE_VIEW });
  const payments = await listRevenuePayments(context.business.id);

  return { context, payments };
});

export const getRevopsRecognitionContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.REVENUE_VIEW });
  const recognition = await listRevenueRecognition(context.business.id);

  return { context, recognition };
});

export const getRevopsExpensesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.REVENUE_VIEW });
  const expenses = await listRevenueExpenses(context.business.id);

  return { context, expenses };
});

export const getRevopsProfitabilityContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.REVENUE_VIEW });
  const profitability = await getProfitabilityReport(context.business.id);

  return { context, profitability };
});

export const getRevopsForecastingContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FORECASTING_VIEW });
  const forecast = await generateRevenueForecast(context.business.id);

  return { context, forecast };
});

export const getRevopsAnalyticsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.REVENUE_VIEW });
  const analytics = await getRevenueAnalytics(context.business.id);

  return { context, analytics };
});

export const getRevopsCollectionsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.REVENUE_VIEW });
  const collections = await listCollectionCases(context.business.id);

  return { context, collections };
});
