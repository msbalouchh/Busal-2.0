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
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import type {
  InventoryHistoryQuery,
  InventoryListQuery,
  PurchaseOrderListQuery,
  SupplierListQuery,
} from "@/modules/inventory-supplier-management/types/inventory-supplier-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getInventoryDashboardStats,
  getManagedInventoryItem,
  listInventoryHistory,
  listInventoryItemsForSelect,
  listLowStockItems,
  listManagedInventoryItems,
} from "@/services/restaurant-inventory.service";
import {
  getManagedPurchaseOrder,
  getSupplierPurchaseOrders,
  listManagedPurchaseOrders,
} from "@/services/restaurant-purchase-order.service";
import {
  getManagedSupplier,
  listManagedSuppliers,
  listSuppliersForSelect,
} from "@/services/restaurant-supplier.service";
import { getRestaurantFoundationBundle } from "@/services/restaurant-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";
import type { BranchManagementRecord } from "@/modules/branch-management/types/branch-management-types";

export interface InventorySupplierPermissions {
  canViewInventory: boolean;
  canCreateInventory: boolean;
  canUpdateInventory: boolean;
  canDeleteInventory: boolean;
  canAdjustInventory: boolean;
  canViewSupplier: boolean;
  canCreateSupplier: boolean;
  canUpdateSupplier: boolean;
  canViewPurchaseOrder: boolean;
  canCreatePurchaseOrder: boolean;
  canReceivePurchaseOrder: boolean;
}

export interface InventorySupplierContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: InventorySupplierPermissions;
  branches: BranchManagementRecord[];
  selectedBranchId: string | null;
  moduleEnabled: boolean;
}

function buildInventorySupplierPermissions(
  authorization: AuthorizationContext,
): InventorySupplierPermissions {
  const { permissions, isOwner } = authorization;
  const canManageInventory =
    isOwner || hasPermission(permissions, PERMISSION_CODES.INVENTORY_MANAGE);

  return {
    canViewInventory:
      canManageInventory || hasPermission(permissions, PERMISSION_CODES.INVENTORY_VIEW),
    canCreateInventory:
      canManageInventory || hasPermission(permissions, PERMISSION_CODES.INVENTORY_CREATE),
    canUpdateInventory:
      canManageInventory || hasPermission(permissions, PERMISSION_CODES.INVENTORY_UPDATE),
    canDeleteInventory:
      canManageInventory || hasPermission(permissions, PERMISSION_CODES.INVENTORY_DELETE),
    canAdjustInventory:
      canManageInventory || hasPermission(permissions, PERMISSION_CODES.INVENTORY_ADJUST),
    canViewSupplier:
      canManageInventory || hasPermission(permissions, PERMISSION_CODES.SUPPLIER_VIEW),
    canCreateSupplier:
      canManageInventory || hasPermission(permissions, PERMISSION_CODES.SUPPLIER_CREATE),
    canUpdateSupplier:
      canManageInventory || hasPermission(permissions, PERMISSION_CODES.SUPPLIER_UPDATE),
    canViewPurchaseOrder:
      canManageInventory || hasPermission(permissions, PERMISSION_CODES.PURCHASE_ORDER_VIEW),
    canCreatePurchaseOrder:
      canManageInventory || hasPermission(permissions, PERMISSION_CODES.PURCHASE_ORDER_CREATE),
    canReceivePurchaseOrder:
      canManageInventory || hasPermission(permissions, PERMISSION_CODES.PURCHASE_ORDER_RECEIVE),
  };
}

async function resolveInventoryBusiness(user: AuthUser) {
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

export const getInventorySupplierContext = cache(
  async (branchId?: string): Promise<InventorySupplierContext> => {
    const user = await requireApplicationAccess();
    const loaded = await resolveInventoryBusiness(user);
    const permissionsFlags = buildInventorySupplierPermissions(loaded.authorization);

    if (!permissionsFlags.canViewInventory) redirect(ROUTES.application);
    if (!loaded.moduleEnabled) redirect("/app/modules/restaurant");

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

export async function requireInventorySupplierActionContext(
  permission: string,
): Promise<InventorySupplierContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveInventoryBusiness(user);
  const permissionsFlags = buildInventorySupplierPermissions(loaded.authorization);
  const allowed =
    loaded.authorization.isOwner || hasPermission(loaded.authorization.permissions, permission);

  if (!allowed) throw permissionDenied();

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
    branches: loaded.branches,
    selectedBranchId: resolveSelectedBranch(loaded.branches),
    moduleEnabled: loaded.moduleEnabled,
  };
}

export const getInventoryDashboardContext = cache(
  async (
    branchId: string,
    search?: string,
    status?: InventoryListQuery["status"],
    sortBy?: InventoryListQuery["sortBy"],
    sortDirection?: InventoryListQuery["sortDirection"],
    page?: number,
  ) => {
    const context = await getInventorySupplierContext(branchId);
    const selectedBranchId = context.selectedBranchId;
    if (!selectedBranchId) {
      return {
        ...context,
        list: { items: [], total: 0, page: 1, pageSize: 24, totalPages: 1 },
        stats: {
          totalItems: 0,
          activeItems: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          totalStockValue: 0,
          openPurchaseOrders: 0,
        },
        lowStockItems: [],
      };
    }

    const query: InventoryListQuery = {
      branchId: selectedBranchId,
      search,
      status,
      sortBy,
      sortDirection,
      page,
    };

    const [list, stats, lowStockItems] = await Promise.all([
      listManagedInventoryItems(context.user.id, query),
      getInventoryDashboardStats(context.user.id, selectedBranchId),
      listLowStockItems(context.user.id, selectedBranchId),
    ]);

    return { ...context, list, stats, lowStockItems };
  },
);

export const getInventoryItemContext = cache(async (branchId: string, itemId: string) => {
  const context = await getInventorySupplierContext(branchId);
  if (!context.selectedBranchId) redirect(INVENTORY_SUPPLIER_ROUTES.dashboard());

  const [item, history] = await Promise.all([
    getManagedInventoryItem(context.user.id, context.selectedBranchId, itemId),
    listInventoryHistory(context.user.id, {
      branchId: context.selectedBranchId,
      inventoryItemId: itemId,
      pageSize: 20,
    }),
  ]);

  return { ...context, item, history };
});

export const getSupplierListContext = cache(async (query: SupplierListQuery) => {
  const context = await getInventorySupplierContext();
  if (!context.permissionsFlags.canViewSupplier) redirect(INVENTORY_SUPPLIER_ROUTES.dashboard());

  const list = await listManagedSuppliers(context.user.id, query);
  return { ...context, list };
});

export const getSupplierDetailsContext = cache(async (supplierId: string) => {
  const context = await getInventorySupplierContext();
  if (!context.permissionsFlags.canViewSupplier) redirect(INVENTORY_SUPPLIER_ROUTES.dashboard());

  const [supplier, purchaseOrders] = await Promise.all([
    getManagedSupplier(context.user.id, supplierId),
    getSupplierPurchaseOrders(context.user.id, supplierId),
  ]);

  return { ...context, supplier, purchaseOrders };
});

export const getPurchaseOrderListContext = cache(
  async (branchId: string, query: Omit<PurchaseOrderListQuery, "branchId">) => {
    const context = await getInventorySupplierContext(branchId);
    if (!context.permissionsFlags.canViewPurchaseOrder) {
      redirect(INVENTORY_SUPPLIER_ROUTES.dashboard());
    }
    if (!context.selectedBranchId) {
      return {
        ...context,
        list: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 },
        suppliers: [],
      };
    }

    const [list, suppliers] = await Promise.all([
      listManagedPurchaseOrders(context.user.id, {
        branchId: context.selectedBranchId,
        ...query,
      }),
      listSuppliersForSelect(context.user.id),
    ]);

    return { ...context, list, suppliers };
  },
);

export const getPurchaseOrderDetailsContext = cache(
  async (branchId: string, purchaseOrderId: string) => {
    const context = await getInventorySupplierContext(branchId);
    if (!context.selectedBranchId) redirect(INVENTORY_SUPPLIER_ROUTES.dashboard());

    const purchaseOrder = await getManagedPurchaseOrder(
      context.user.id,
      context.selectedBranchId,
      purchaseOrderId,
    );

    return { ...context, purchaseOrder };
  },
);

export const getInventoryHistoryContext = cache(
  async (branchId: string, query: InventoryHistoryQuery) => {
    const context = await getInventorySupplierContext(branchId);
    if (!context.selectedBranchId) redirect(INVENTORY_SUPPLIER_ROUTES.dashboard());

    const history = await listInventoryHistory(context.user.id, {
      ...query,
      branchId: context.selectedBranchId,
    });

    return { ...context, history };
  },
);

export const getCreatePurchaseOrderContext = cache(async (branchId: string) => {
  const context = await getInventorySupplierContext(branchId);
  if (!context.selectedBranchId) redirect(INVENTORY_SUPPLIER_ROUTES.dashboard());

  const [suppliers, inventoryItems] = await Promise.all([
    listSuppliersForSelect(context.user.id),
    listInventoryItemsForSelect(context.user.id, context.selectedBranchId),
  ]);

  return { ...context, suppliers, inventoryItems };
});
