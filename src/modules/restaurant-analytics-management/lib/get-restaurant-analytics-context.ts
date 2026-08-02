import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  hasPermission,
  resolveAuthorizationContext,
} from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import {
  defaultDateRange,
  validateAnalyticsFilters,
} from "@/modules/restaurant-analytics-management/lib/restaurant-analytics-validation";
import { RESTAURANT_ANALYTICS_ROUTES } from "@/modules/restaurant-analytics-management/constants/routes";
import type { AnalyticsFilters } from "@/modules/restaurant-analytics-management/types/restaurant-analytics-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import { listManagedBranches } from "@/services/branch-management.service";
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
  runCustomReport,
} from "@/services/restaurant-analytics.service";
import {
  getSavedReport,
  listDashboardWidgets,
  listSavedReports,
} from "@/services/restaurant-saved-report.service";
import { getRestaurantFoundationBundle } from "@/services/restaurant-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";
import type { BranchManagementRecord } from "@/modules/branch-management/types/branch-management-types";
import type { ReportType } from "@prisma/client";

export interface RestaurantAnalyticsPermissions {
  canViewAnalytics: boolean;
  canExport: boolean;
  canCreateReport: boolean;
  canEditReport: boolean;
  canDeleteReport: boolean;
  canManageDashboard: boolean;
}

export interface RestaurantAnalyticsContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: RestaurantAnalyticsPermissions;
  branches: BranchManagementRecord[];
  selectedBranchId: string | null;
  filters: AnalyticsFilters;
  moduleEnabled: boolean;
}

function buildAnalyticsPermissions(
  authorization: AuthorizationContext,
): RestaurantAnalyticsPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canViewAnalytics: isOwner || hasPermission(permissions, PERMISSION_CODES.ANALYTICS_VIEW),
    canExport: isOwner || hasPermission(permissions, PERMISSION_CODES.ANALYTICS_EXPORT),
    canCreateReport:
      isOwner || hasPermission(permissions, PERMISSION_CODES.ANALYTICS_CREATE_REPORT),
    canEditReport: isOwner || hasPermission(permissions, PERMISSION_CODES.ANALYTICS_EDIT_REPORT),
    canDeleteReport:
      isOwner || hasPermission(permissions, PERMISSION_CODES.ANALYTICS_DELETE_REPORT),
    canManageDashboard: isOwner || hasPermission(permissions, PERMISSION_CODES.DASHBOARD_MANAGE),
  };
}

async function resolveAnalyticsBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();

  const authorization = await resolveAuthorizationContext(user, business);
  const bundle = await getRestaurantFoundationBundle(user.id);
  const branchResult = await listManagedBranches(business.id, { pageSize: 200, status: "ACTIVE" });

  return {
    business,
    authorization,
    branches: branchResult.items,
    moduleEnabled: bundle.moduleEnabled,
  };
}

function resolveSelectedBranch(
  branches: BranchManagementRecord[],
  branchId?: string,
): string | null {
  if (branchId && branches.some((branch) => branch.id === branchId)) return branchId;
  return branches.find((branch) => branch.isPrimary)?.id ?? branches[0]?.id ?? null;
}

function resolveFilters(branchId: string | null, from?: string, to?: string): AnalyticsFilters {
  const dateRange = from && to ? { from, to } : defaultDateRange();
  const filters: AnalyticsFilters = { branchId, dateRange };
  validateAnalyticsFilters(filters);
  return filters;
}

export const getRestaurantAnalyticsContext = cache(
  async (branchId?: string, from?: string, to?: string): Promise<RestaurantAnalyticsContext> => {
    const user = await requireApplicationAccess();
    const loaded = await resolveAnalyticsBusiness(user);
    const permissionsFlags = buildAnalyticsPermissions(loaded.authorization);

    if (!permissionsFlags.canViewAnalytics) redirect(ROUTES.application);
    if (!loaded.moduleEnabled) redirect("/app/modules/restaurant");

    const selectedBranchId = resolveSelectedBranch(loaded.branches, branchId);
    const filters = resolveFilters(selectedBranchId, from, to);

    return {
      user,
      business: loaded.business,
      authorization: loaded.authorization,
      permissionsFlags,
      branches: loaded.branches,
      selectedBranchId,
      filters,
      moduleEnabled: loaded.moduleEnabled,
    };
  },
);

export async function requireRestaurantAnalyticsActionContext(
  permission: string,
): Promise<RestaurantAnalyticsContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveAnalyticsBusiness(user);
  const permissionsFlags = buildAnalyticsPermissions(loaded.authorization);
  const allowed =
    loaded.authorization.isOwner || hasPermission(loaded.authorization.permissions, permission);

  if (!allowed) throw permissionDenied();

  const selectedBranchId = resolveSelectedBranch(loaded.branches);

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
    branches: loaded.branches,
    selectedBranchId,
    filters: resolveFilters(selectedBranchId),
    moduleEnabled: loaded.moduleEnabled,
  };
}

export const getExecutiveDashboardContext = cache(
  async (branchId?: string, from?: string, to?: string) => {
    const context = await getRestaurantAnalyticsContext(branchId, from, to);
    const [dashboard, widgets] = await Promise.all([
      getExecutiveDashboard(context.user.id, context.filters),
      listDashboardWidgets(context.user.id),
    ]);
    return { ...context, dashboard, widgets };
  },
);

export const getSalesDashboardContext = cache(
  async (branchId?: string, from?: string, to?: string) => {
    const context = await getRestaurantAnalyticsContext(branchId, from, to);
    const dashboard = await getSalesDashboard(context.user.id, context.filters);
    return { ...context, dashboard };
  },
);

export const getOrdersDashboardContext = cache(
  async (branchId?: string, from?: string, to?: string) => {
    const context = await getRestaurantAnalyticsContext(branchId, from, to);
    const dashboard = await getOrdersDashboard(context.user.id, context.filters);
    return { ...context, dashboard };
  },
);

export const getPaymentsDashboardContext = cache(
  async (branchId?: string, from?: string, to?: string) => {
    const context = await getRestaurantAnalyticsContext(branchId, from, to);
    const dashboard = await getPaymentsDashboard(context.user.id, context.filters);
    return { ...context, dashboard };
  },
);

export const getCustomersDashboardContext = cache(
  async (branchId?: string, from?: string, to?: string) => {
    const context = await getRestaurantAnalyticsContext(branchId, from, to);
    const dashboard = await getCustomersDashboard(context.user.id, context.filters);
    return { ...context, dashboard };
  },
);

export const getProductsDashboardContext = cache(
  async (branchId?: string, from?: string, to?: string) => {
    const context = await getRestaurantAnalyticsContext(branchId, from, to);
    const dashboard = await getProductsDashboard(context.user.id, context.filters);
    return { ...context, dashboard };
  },
);

export const getInventoryAnalyticsContext = cache(
  async (branchId?: string, from?: string, to?: string) => {
    const context = await getRestaurantAnalyticsContext(branchId, from, to);
    const dashboard = await getInventoryDashboard(context.user.id, context.filters);
    return { ...context, dashboard };
  },
);

export const getKitchenAnalyticsContext = cache(
  async (branchId?: string, from?: string, to?: string) => {
    const context = await getRestaurantAnalyticsContext(branchId, from, to);
    const dashboard = await getKitchenDashboard(context.user.id, context.filters);
    return { ...context, dashboard };
  },
);

export const getStaffAnalyticsContext = cache(
  async (branchId?: string, from?: string, to?: string) => {
    const context = await getRestaurantAnalyticsContext(branchId, from, to);
    const dashboard = await getStaffDashboard(context.user.id, context.filters);
    return { ...context, dashboard };
  },
);

export const getReservationsAnalyticsContext = cache(
  async (branchId?: string, from?: string, to?: string) => {
    const context = await getRestaurantAnalyticsContext(branchId, from, to);
    const dashboard = await getReservationsDashboard(context.user.id, context.filters);
    return { ...context, dashboard };
  },
);

export const getSavedReportsContext = cache(async () => {
  const context = await getRestaurantAnalyticsContext();
  const reports = await listSavedReports(context.user.id);
  return { ...context, reports };
});

export const getReportBuilderContext = cache(async () => {
  const context = await getRestaurantAnalyticsContext();
  if (!context.permissionsFlags.canCreateReport) {
    redirect(RESTAURANT_ANALYTICS_ROUTES.dashboard());
  }
  return context;
});

export const getSavedReportContext = cache(async (reportId: string) => {
  const context = await getRestaurantAnalyticsContext();
  const report = await getSavedReport(context.user.id, reportId);
  const result = await runCustomReport(context.user.id, report.reportType, report.filters);
  return { ...context, report, result };
});

export async function getCustomReportContext(reportType: ReportType, filters: AnalyticsFilters) {
  const context = await getRestaurantAnalyticsContext(
    filters.branchId ?? undefined,
    filters.dateRange.from,
    filters.dateRange.to,
  );
  const result = await runCustomReport(context.user.id, reportType, filters);
  return { ...context, result };
}
