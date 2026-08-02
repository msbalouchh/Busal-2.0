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
  RESERVATION_LIST_PAGE_SIZE,
  RESERVATION_MANAGEMENT_ROUTES,
} from "@/modules/reservation-management/constants/routes";
import type { ReservationListQuery } from "@/modules/reservation-management/types/reservation-management-types";
import { getWeekDateRange } from "@/modules/reservation-management/lib/reservation-validation";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getManagedReservation,
  getReservationDashboardStats,
  listBranchCustomersForSelect,
  listBranchReservableTablesForSelect,
  listBranchStaffForSelect,
  listCalendarReservations,
  listManagedReservations,
} from "@/services/restaurant-reservation.service";
import { getRestaurantFoundationBundle } from "@/services/restaurant-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";
import type { BranchManagementRecord } from "@/modules/branch-management/types/branch-management-types";

export interface ReservationManagementPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canCancel: boolean;
  canDelete: boolean;
  canAssignTable: boolean;
  canAssignStaff: boolean;
}

export interface ReservationManagementContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ReservationManagementPermissions;
  branches: BranchManagementRecord[];
  selectedBranchId: string | null;
  moduleEnabled: boolean;
}

function buildReservationPermissions(
  authorization: AuthorizationContext,
): ReservationManagementPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.RESERVATION_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.RESERVATION_CREATE),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.RESERVATION_UPDATE),
    canCancel: isOwner || hasPermission(permissions, PERMISSION_CODES.RESERVATION_CANCEL),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.RESERVATION_DELETE),
    canAssignTable:
      isOwner || hasPermission(permissions, PERMISSION_CODES.RESERVATION_ASSIGN_TABLE),
    canAssignStaff:
      isOwner || hasPermission(permissions, PERMISSION_CODES.RESERVATION_ASSIGN_STAFF),
  };
}

async function resolveReservationBusiness(user: AuthUser) {
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

export const getReservationManagementContext = cache(
  async (branchId?: string): Promise<ReservationManagementContext> => {
    const user = await requireApplicationAccess();
    const loaded = await resolveReservationBusiness(user);
    const permissionsFlags = buildReservationPermissions(loaded.authorization);

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

export async function requireReservationActionContext(
  branchId: string,
  permission: string,
): Promise<ReservationManagementContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw permissionDenied();
  }

  const loaded = await resolveReservationBusiness(user);
  const permissionsFlags = buildReservationPermissions(loaded.authorization);
  const selectedBranchId = resolveSelectedBranch(loaded.branches, branchId);

  if (!selectedBranchId || selectedBranchId !== branchId) {
    throw new Error("Branch not found");
  }

  const allowed =
    loaded.authorization.isOwner ||
    hasPermission(loaded.authorization.permissions, permission) ||
    (permission === PERMISSION_CODES.RESERVATION_CANCEL &&
      hasPermission(loaded.authorization.permissions, PERMISSION_CODES.RESERVATION_UPDATE));

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

export const getReservationListContext = cache(
  async (branchId: string, query: ReservationListQuery) => {
    const context = await getReservationManagementContext(branchId);
    const selectedBranchId = context.selectedBranchId;

    if (!selectedBranchId) {
      return {
        ...context,
        list: {
          items: [],
          total: 0,
          page: 1,
          pageSize: RESERVATION_LIST_PAGE_SIZE,
          totalPages: 1,
        },
        stats: {
          totalToday: 0,
          pendingToday: 0,
          confirmedToday: 0,
          seatedToday: 0,
          completedToday: 0,
          cancelledToday: 0,
          noShowToday: 0,
          upcomingWeek: 0,
        },
        calendarEntries: [],
      };
    }

    const listQuery = { ...query, branchId: selectedBranchId };
    const referenceDate = query.date ?? new Date().toISOString().slice(0, 10);
    const weekRange =
      query.view === "calendar"
        ? getWeekDateRange(referenceDate)
        : { dateFrom: referenceDate, dateTo: referenceDate };

    const [list, stats, calendarEntries] = await Promise.all([
      listManagedReservations(context.user.id, listQuery),
      getReservationDashboardStats(context.business.id, selectedBranchId),
      listCalendarReservations(
        context.user.id,
        selectedBranchId,
        weekRange.dateFrom,
        weekRange.dateTo,
      ),
    ]);

    return { ...context, list, stats, calendarEntries };
  },
);

export const getReservationDetailsContext = cache(
  async (branchId: string, reservationId: string) => {
    const context = await getReservationManagementContext(branchId);

    if (!context.selectedBranchId) {
      redirect(RESERVATION_MANAGEMENT_ROUTES.list());
    }

    const reservation = await getManagedReservation(
      context.user.id,
      context.selectedBranchId,
      reservationId,
    );

    return { ...context, reservation };
  },
);

export const getReservationFormContext = cache(async (branchId: string) => {
  const context = await getReservationManagementContext(branchId);

  if (!context.selectedBranchId) {
    return {
      ...context,
      tables: [],
      staff: [],
      customers: [],
    };
  }

  const [tables, staff, customers] = await Promise.all([
    listBranchReservableTablesForSelect(context.user.id, context.selectedBranchId),
    listBranchStaffForSelect(context.user.id, context.selectedBranchId),
    listBranchCustomersForSelect(context.user.id),
  ]);

  return { ...context, tables, staff, customers };
});
