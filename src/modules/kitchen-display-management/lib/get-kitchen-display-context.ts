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
import { KITCHEN_DISPLAY_ROUTES } from "@/modules/kitchen-display-management/constants/routes";
import type { KitchenQueueQuery } from "@/modules/kitchen-display-management/types/kitchen-display-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getKitchenDashboardStats,
  listBranchProductsForKitchenStation,
  listKitchenQueue,
  listKitchenStations,
} from "@/services/restaurant-kitchen-display.service";
import { getRestaurantFoundationBundle } from "@/services/restaurant-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";
import type { BranchManagementRecord } from "@/modules/branch-management/types/branch-management-types";

export interface KitchenDisplayPermissions {
  canView: boolean;
  canUpdate: boolean;
  canAssignStation: boolean;
  canManage: boolean;
}

export interface KitchenDisplayContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: KitchenDisplayPermissions;
  branches: BranchManagementRecord[];
  selectedBranchId: string | null;
  moduleEnabled: boolean;
}

function buildKitchenPermissions(authorization: AuthorizationContext): KitchenDisplayPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.KITCHEN_VIEW),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.KITCHEN_UPDATE),
    canAssignStation:
      isOwner || hasPermission(permissions, PERMISSION_CODES.KITCHEN_ASSIGN_STATION),
    canManage: isOwner || hasPermission(permissions, PERMISSION_CODES.KITCHEN_MANAGE),
  };
}

async function resolveKitchenBusiness(user: AuthUser) {
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

export const getKitchenDisplayContext = cache(
  async (branchId?: string): Promise<KitchenDisplayContext> => {
    const user = await requireApplicationAccess();
    const loaded = await resolveKitchenBusiness(user);
    const permissionsFlags = buildKitchenPermissions(loaded.authorization);

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

export async function requireKitchenActionContext(
  branchId: string,
  permission: string,
): Promise<KitchenDisplayContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw permissionDenied();
  }

  const loaded = await resolveKitchenBusiness(user);
  const permissionsFlags = buildKitchenPermissions(loaded.authorization);
  const selectedBranchId = resolveSelectedBranch(loaded.branches, branchId);

  if (!selectedBranchId || selectedBranchId !== branchId) {
    throw new Error("Branch not found");
  }

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
    branches: loaded.branches,
    selectedBranchId,
    moduleEnabled: loaded.moduleEnabled,
  };
}

export const getKitchenDashboardContext = cache(
  async (branchId: string, stationId?: string, search?: string) => {
    const context = await getKitchenDisplayContext(branchId);
    const selectedBranchId = context.selectedBranchId;

    if (!selectedBranchId) {
      return {
        ...context,
        queue: [],
        stats: {
          newCount: 0,
          acceptedCount: 0,
          preparingCount: 0,
          readyCount: 0,
          servedToday: 0,
          completedToday: 0,
          averagePrepMinutes: 0,
          priorityCount: 0,
        },
        stations: [],
      };
    }

    const query: KitchenQueueQuery = {
      branchId: selectedBranchId,
      stationId: stationId || null,
      search,
    };

    const [queue, stats, stations] = await Promise.all([
      listKitchenQueue(context.user.id, query),
      getKitchenDashboardStats(context.business.id, selectedBranchId),
      listKitchenStations(context.user.id, selectedBranchId),
    ]);

    return { ...context, queue, stats, stations };
  },
);

export const getKitchenStationManagementContext = cache(async (branchId: string) => {
  const context = await getKitchenDisplayContext(branchId);

  if (!context.selectedBranchId) {
    redirect(KITCHEN_DISPLAY_ROUTES.dashboard());
  }

  if (!context.permissionsFlags.canManage && !context.permissionsFlags.canAssignStation) {
    redirect(KITCHEN_DISPLAY_ROUTES.dashboardForBranch(context.selectedBranchId));
  }

  const [stations, products] = await Promise.all([
    listKitchenStations(context.user.id, context.selectedBranchId),
    listBranchProductsForKitchenStation(context.user.id, context.selectedBranchId),
  ]);

  return { ...context, stations, products };
});
