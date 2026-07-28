import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeCustomerAnalytics,
  serializeFinancialReport,
  serializeInventoryAnalytics,
  serializeOrderAnalytics,
  serializeProductAnalytics,
  serializeReportingDashboard,
  serializeSalesDashboard,
  serializeStaffAnalytics,
} from "@/modules/reporting/utils/reporting-utils";
import {
  getCustomerAnalytics,
  getFinancialReport,
  getInventoryAnalytics,
  getOrderAnalytics,
  getProductAnalytics,
  getReportingDashboard,
  getSalesDashboard,
  getStaffAnalytics,
} from "@/services/reporting.service";

export const getReportingOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.ANALYTICS_VIEW });
  const dashboard = await getReportingDashboard(context.business.id, context.branchId);

  return {
    context,
    dashboard: serializeReportingDashboard(dashboard),
  };
});

export const getReportingSalesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.ANALYTICS_VIEW });
  const sales = await getSalesDashboard(context.business.id, context.branchId);

  return {
    context,
    sales: serializeSalesDashboard(sales),
  };
});

export const getReportingOrdersContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.ANALYTICS_VIEW });
  const analytics = await getOrderAnalytics(context.business.id, undefined, context.branchId);

  return {
    context,
    analytics: serializeOrderAnalytics(analytics),
  };
});

export const getReportingProductsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.ANALYTICS_VIEW });
  const analytics = await getProductAnalytics(context.business.id, undefined, context.branchId);

  return {
    context,
    analytics: serializeProductAnalytics(analytics),
  };
});

export const getReportingCustomersContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.ANALYTICS_VIEW });
  const analytics = await getCustomerAnalytics(context.business.id, undefined, context.branchId);

  return {
    context,
    analytics: serializeCustomerAnalytics(analytics),
  };
});

export const getReportingInventoryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.ANALYTICS_VIEW });
  const analytics = await getInventoryAnalytics(context.business.id, context.branchId);

  return {
    context,
    analytics: serializeInventoryAnalytics(analytics),
  };
});

export const getReportingStaffContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.ANALYTICS_VIEW });
  const staff = await getStaffAnalytics(context.business.id, undefined, context.branchId);

  return {
    context,
    analytics: serializeStaffAnalytics(staff),
  };
});

export const getReportingFinancialContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.ANALYTICS_VIEW });
  const [daily, weekly, monthly] = await Promise.all([
    getFinancialReport(context.business.id, "daily", context.branchId),
    getFinancialReport(context.business.id, "weekly", context.branchId),
    getFinancialReport(context.business.id, "monthly", context.branchId),
  ]);

  return {
    context,
    daily: serializeFinancialReport(daily),
    weekly: serializeFinancialReport(weekly),
    monthly: serializeFinancialReport(monthly),
  };
});
