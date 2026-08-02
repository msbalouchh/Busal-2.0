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
import { listManagedBranches } from "@/services/branch-management.service";
import {
  ORDER_LIST_PAGE_SIZE,
  ORDER_MANAGEMENT_ROUTES,
} from "@/modules/order-management/constants/routes";
import type { OrderListQuery } from "@/modules/order-management/types/order-management-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getManagedOrder,
  getOrderDashboardStats,
  listBranchCustomersForOrderSelect,
  listBranchProductsForOrder,
  listBranchStaffForOrderSelect,
  listBranchTablesForOrderSelect,
  listManagedOrders,
} from "@/services/restaurant-order.service";
import { getRestaurantFoundationBundle } from "@/services/restaurant-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";
import type { BranchManagementRecord } from "@/modules/branch-management/types/branch-management-types";

export interface OrderManagementPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canCancel: boolean;
  canDelete: boolean;
  canDiscount: boolean;
  canTransfer: boolean;
}

export interface OrderManagementContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: OrderManagementPermissions;
  branches: BranchManagementRecord[];
  selectedBranchId: string | null;
  moduleEnabled: boolean;
}

function buildOrderPermissions(authorization: AuthorizationContext): OrderManagementPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.ORDER_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.ORDER_CREATE),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.ORDER_UPDATE),
    canCancel: isOwner || hasPermission(permissions, PERMISSION_CODES.ORDER_CANCEL),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.ORDER_DELETE),
    canDiscount: isOwner || hasPermission(permissions, PERMISSION_CODES.ORDER_DISCOUNT),
    canTransfer: isOwner || hasPermission(permissions, PERMISSION_CODES.ORDER_TRANSFER),
  };
}

async function resolveOrderBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);

  if (!business?.id) {
    throw permissionDenied();
  }

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
  if (branchId && branches.some((branch) => branch.id === branchId)) {
    return branchId;
  }

  return branches.find((branch) => branch.isPrimary)?.id ?? branches[0]?.id ?? null;
}

export const getOrderManagementContext = cache(
  async (branchId?: string): Promise<OrderManagementContext> => {
    const user = await requireApplicationAccess();
    const loaded = await resolveOrderBusiness(user);
    const permissionsFlags = buildOrderPermissions(loaded.authorization);

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
      branches: loaded.branches,
      selectedBranchId: resolveSelectedBranch(loaded.branches, branchId),
      moduleEnabled: loaded.moduleEnabled,
    };
  },
);

export async function requireOrderActionContext(
  branchId: string,
  permission: string,
): Promise<OrderManagementContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw permissionDenied();
  }

  const loaded = await resolveOrderBusiness(user);
  const permissionsFlags = buildOrderPermissions(loaded.authorization);
  const selectedBranchId = resolveSelectedBranch(loaded.branches, branchId);

  if (!selectedBranchId || selectedBranchId !== branchId) {
    throw new Error("Branch not found");
  }

  const allowed =
    loaded.authorization.isOwner ||
    hasPermission(loaded.authorization.permissions, permission) ||
    (permission === PERMISSION_CODES.ORDER_CANCEL &&
      hasPermission(loaded.authorization.permissions, PERMISSION_CODES.ORDER_UPDATE)) ||
    (permission === PERMISSION_CODES.ORDER_DISCOUNT &&
      hasPermission(loaded.authorization.permissions, PERMISSION_CODES.ORDER_UPDATE));

  if (!allowed) {
    throw permissionDenied();
  }

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
    branches: loaded.branches,
    selectedBranchId,
    moduleEnabled: loaded.moduleEnabled,
  };
}

export const getOrderListContext = cache(async (branchId: string, query: OrderListQuery) => {
  const context = await getOrderManagementContext(branchId);
  const selectedBranchId = context.selectedBranchId;

  if (!selectedBranchId) {
    return {
      ...context,
      list: {
        items: [],
        total: 0,
        page: 1,
        pageSize: ORDER_LIST_PAGE_SIZE,
        totalPages: 1,
      },
      stats: {
        totalToday: 0,
        pendingToday: 0,
        preparingToday: 0,
        readyToday: 0,
        completedToday: 0,
        cancelledToday: 0,
        unpaidToday: 0,
        revenueToday: 0,
      },
      queueOrders: [],
    };
  }

  const listQuery = { ...query, branchId: selectedBranchId };

  const [list, stats, queueResult] = await Promise.all([
    listManagedOrders(context.user.id, listQuery),
    getOrderDashboardStats(context.business.id, selectedBranchId),
    listManagedOrders(context.user.id, {
      branchId: selectedBranchId,
      status: "ALL",
      orderType: "ALL",
      paymentStatus: "ALL",
      sortBy: "placedAt",
      sortDirection: "asc",
      page: 1,
      pageSize: 50,
    }),
  ]);

  const queueOrders = queueResult.items.filter((order) =>
    ["PENDING", "CONFIRMED", "PREPARING", "READY"].includes(order.status),
  );

  return { ...context, list, stats, queueOrders };
});

export const getOrderDetailsContext = cache(async (branchId: string, orderId: string) => {
  const context = await getOrderManagementContext(branchId);

  if (!context.selectedBranchId) {
    redirect(ORDER_MANAGEMENT_ROUTES.list());
  }

  const [order, tables, mergeResult] = await Promise.all([
    getManagedOrder(context.user.id, context.selectedBranchId, orderId),
    listBranchTablesForOrderSelect(context.user.id, context.selectedBranchId),
    listManagedOrders(context.user.id, {
      branchId: context.selectedBranchId,
      status: "ALL",
      orderType: "ALL",
      paymentStatus: "ALL",
      sortBy: "placedAt",
      sortDirection: "desc",
      page: 1,
      pageSize: 50,
    }),
  ]);

  const mergeCandidates = mergeResult.items.filter(
    (candidate) =>
      candidate.id !== orderId && !["COMPLETED", "CANCELLED"].includes(candidate.status),
  );

  return { ...context, order, tables, mergeCandidates };
});

export const getOrderFormContext = cache(async (branchId: string) => {
  const context = await getOrderManagementContext(branchId);

  if (!context.selectedBranchId) {
    return {
      ...context,
      products: [],
      tables: [],
      staff: [],
      customers: [],
    };
  }

  const [products, tables, staff, customers] = await Promise.all([
    listBranchProductsForOrder(context.user.id, context.selectedBranchId),
    listBranchTablesForOrderSelect(context.user.id, context.selectedBranchId),
    listBranchStaffForOrderSelect(context.user.id, context.selectedBranchId),
    listBranchCustomersForOrderSelect(context.user.id),
  ]);

  return { ...context, products, tables, staff, customers };
});
