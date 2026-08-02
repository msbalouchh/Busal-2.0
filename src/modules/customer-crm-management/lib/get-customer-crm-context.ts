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
import { CUSTOMER_CRM_ROUTES } from "@/modules/customer-crm-management/constants/routes";
import type { CustomerListQuery } from "@/modules/customer-crm-management/types/customer-crm-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  exportManagedCustomers,
  getCustomerDashboardStats,
  getCustomerProfileBundle,
  getManagedCustomer,
  listManagedCustomers,
} from "@/services/restaurant-customer.service";
import { getRestaurantFoundationBundle } from "@/services/restaurant-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";

export interface CustomerCrmPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canImport: boolean;
  canExport: boolean;
  canViewLoyalty: boolean;
  canManageLoyalty: boolean;
}

export interface CustomerCrmContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: CustomerCrmPermissions;
  moduleEnabled: boolean;
}

function buildCustomerCrmPermissions(authorization: AuthorizationContext): CustomerCrmPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.CUSTOMER_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.CUSTOMER_CREATE),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.CUSTOMER_UPDATE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.CUSTOMER_DELETE),
    canImport: isOwner || hasPermission(permissions, PERMISSION_CODES.CUSTOMER_IMPORT),
    canExport: isOwner || hasPermission(permissions, PERMISSION_CODES.CUSTOMER_EXPORT),
    canViewLoyalty: isOwner || hasPermission(permissions, PERMISSION_CODES.LOYALTY_VIEW),
    canManageLoyalty: isOwner || hasPermission(permissions, PERMISSION_CODES.LOYALTY_MANAGE),
  };
}

async function resolveCustomerCrmBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);

  if (!business?.id) {
    throw permissionDenied();
  }

  const authorization = await resolveAuthorizationContext(user, business);
  const bundle = await getRestaurantFoundationBundle(user.id);

  return {
    business,
    authorization,
    moduleEnabled: bundle.moduleEnabled,
  };
}

export const getCustomerCrmContext = cache(async (): Promise<CustomerCrmContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveCustomerCrmBusiness(user);
  const permissionsFlags = buildCustomerCrmPermissions(loaded.authorization);

  if (!permissionsFlags.canView) {
    redirect(ROUTES.application);
  }

  if (!loaded.moduleEnabled) {
    redirect("/app/modules/restaurant");
  }

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
    moduleEnabled: loaded.moduleEnabled,
  };
});

export async function requireCustomerCrmActionContext(
  permission: string,
): Promise<CustomerCrmContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw permissionDenied();
  }

  const loaded = await resolveCustomerCrmBusiness(user);
  const permissionsFlags = buildCustomerCrmPermissions(loaded.authorization);
  const allowed =
    loaded.authorization.isOwner || hasPermission(loaded.authorization.permissions, permission);

  if (!allowed) {
    throw permissionDenied();
  }

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
    moduleEnabled: loaded.moduleEnabled,
  };
}

export const getCustomerDashboardContext = cache(
  async (search?: string, status?: CustomerListQuery["status"], page?: number) => {
    const context = await getCustomerCrmContext();
    const query: CustomerListQuery = { search, status, page };

    const [list, stats] = await Promise.all([
      listManagedCustomers(context.user.id, query),
      getCustomerDashboardStats(context.user.id),
    ]);

    return { ...context, list, stats };
  },
);

export const getCustomerProfileContext = cache(async (customerId: string) => {
  const context = await getCustomerCrmContext();
  const profile = await getCustomerProfileBundle(context.user.id, customerId);

  return { ...context, profile };
});

export const getCustomerLoyaltyContext = cache(async (customerId: string) => {
  const context = await getCustomerCrmContext();

  if (!context.permissionsFlags.canViewLoyalty) {
    redirect(CUSTOMER_CRM_ROUTES.profile(customerId));
  }

  const [customer, profile] = await Promise.all([
    getManagedCustomer(context.user.id, customerId),
    getCustomerProfileBundle(context.user.id, customerId),
  ]);

  return { ...context, customer, loyaltyTransactions: profile.loyaltyTransactions };
});

export const getCustomerImportContext = cache(async () => {
  const context = await getCustomerCrmContext();

  if (!context.permissionsFlags.canImport) {
    redirect(CUSTOMER_CRM_ROUTES.dashboard());
  }

  return context;
});

export const getCustomerExportData = cache(async () => {
  const context = await getCustomerCrmContext();

  if (!context.permissionsFlags.canExport) {
    throw permissionDenied();
  }

  return exportManagedCustomers(context.user.id);
});
