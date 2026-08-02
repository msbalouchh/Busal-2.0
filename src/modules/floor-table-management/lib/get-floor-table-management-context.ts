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
  FLOOR_LIST_PAGE_SIZE,
  FLOOR_TABLE_MANAGEMENT_ROUTES,
} from "@/modules/floor-table-management/constants/routes";
import type { FloorListQuery } from "@/modules/floor-table-management/types/floor-table-management-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getFloorTableDashboardStats,
  getManagedFloor,
  listBranchFloorsForSelect,
  listManagedFloors,
} from "@/services/restaurant-floor.service";
import { getManagedTable, listFloorTables } from "@/services/restaurant-table.service";
import { getRestaurantFoundationBundle } from "@/services/restaurant-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";
import type { BranchManagementRecord } from "@/modules/branch-management/types/branch-management-types";

export interface FloorTableManagementPermissions {
  canViewFloors: boolean;
  canCreateFloors: boolean;
  canUpdateFloors: boolean;
  canDeleteFloors: boolean;
  canViewTables: boolean;
  canCreateTables: boolean;
  canUpdateTables: boolean;
  canDeleteTables: boolean;
}

export interface FloorTableManagementContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: FloorTableManagementPermissions;
  branches: BranchManagementRecord[];
  selectedBranchId: string | null;
  moduleEnabled: boolean;
}

function buildFloorTablePermissions(
  authorization: AuthorizationContext,
): FloorTableManagementPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canViewFloors: isOwner || hasPermission(permissions, PERMISSION_CODES.FLOOR_VIEW),
    canCreateFloors: isOwner || hasPermission(permissions, PERMISSION_CODES.FLOOR_CREATE),
    canUpdateFloors: isOwner || hasPermission(permissions, PERMISSION_CODES.FLOOR_UPDATE),
    canDeleteFloors: isOwner || hasPermission(permissions, PERMISSION_CODES.FLOOR_DELETE),
    canViewTables: isOwner || hasPermission(permissions, PERMISSION_CODES.TABLE_VIEW),
    canCreateTables: isOwner || hasPermission(permissions, PERMISSION_CODES.TABLE_CREATE),
    canUpdateTables: isOwner || hasPermission(permissions, PERMISSION_CODES.TABLE_UPDATE),
    canDeleteTables: isOwner || hasPermission(permissions, PERMISSION_CODES.TABLE_DELETE),
  };
}

async function resolveFloorTableBusiness(user: AuthUser) {
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

export const getFloorTableManagementContext = cache(
  async (branchId?: string): Promise<FloorTableManagementContext> => {
    const user = await requireApplicationAccess();
    const loaded = await resolveFloorTableBusiness(user);
    const permissionsFlags = buildFloorTablePermissions(loaded.authorization);

    if (!permissionsFlags.canViewFloors && !permissionsFlags.canViewTables) {
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

export const getFloorListContext = cache(async (branchId: string, query: FloorListQuery) => {
  const context = await getFloorTableManagementContext(branchId);

  if (!context.selectedBranchId) {
    return {
      ...context,
      list: { items: [], total: 0, page: 1, pageSize: FLOOR_LIST_PAGE_SIZE, totalPages: 1 },
      stats: {
        totalFloors: 0,
        activeFloors: 0,
        totalTables: 0,
        availableTables: 0,
        occupiedTables: 0,
        reservedTables: 0,
      },
      query,
    };
  }

  const normalizedQuery: FloorListQuery = {
    ...query,
    branchId: context.selectedBranchId,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? FLOOR_LIST_PAGE_SIZE,
  };

  const [list, stats] = await Promise.all([
    listManagedFloors(context.business.id, normalizedQuery),
    getFloorTableDashboardStats(context.business.id, context.selectedBranchId),
  ]);

  return { ...context, list, stats, query: normalizedQuery };
});

export const getFloorDetailContext = cache(async (branchId: string, floorId: string) => {
  const context = await getFloorTableManagementContext(branchId);

  if (!context.selectedBranchId) {
    return { ...context, floor: null, tables: [] };
  }

  try {
    const [floor, tables] = await Promise.all([
      getManagedFloor(context.business.id, context.selectedBranchId, floorId),
      listFloorTables(context.business.id, context.selectedBranchId, floorId),
    ]);

    return { ...context, floor, tables };
  } catch {
    return { ...context, floor: null, tables: [] };
  }
});

export const getTableDetailContext = cache(
  async (branchId: string, floorId: string, tableId: string) => {
    const context = await getFloorTableManagementContext(branchId);

    if (!context.selectedBranchId) {
      return { ...context, floor: null, table: null, floors: [] };
    }

    try {
      const [floor, table, floors] = await Promise.all([
        getManagedFloor(context.business.id, context.selectedBranchId, floorId),
        getManagedTable(context.business.id, context.selectedBranchId, tableId),
        listBranchFloorsForSelect(context.business.id, context.selectedBranchId),
      ]);

      return { ...context, floor, table, floors };
    } catch {
      return { ...context, floor: null, table: null, floors: [] };
    }
  },
);

export async function requireFloorTableActionContext(
  branchId: string,
  permission: (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES],
): Promise<FloorTableManagementContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw permissionDenied();
  }

  const loaded = await resolveFloorTableBusiness(user);

  if (
    !hasPermission(loaded.authorization.permissions, permission) &&
    !loaded.authorization.isOwner
  ) {
    throw permissionDenied();
  }

  if (!loaded.moduleEnabled) {
    redirect("/app/modules/restaurant");
  }

  const selectedBranchId = resolveSelectedBranch(loaded.branches, branchId);

  if (!selectedBranchId) {
    redirect(FLOOR_TABLE_MANAGEMENT_ROUTES.floorList());
  }

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags: buildFloorTablePermissions(loaded.authorization),
    branches: loaded.branches,
    selectedBranchId,
    moduleEnabled: loaded.moduleEnabled,
  };
}
