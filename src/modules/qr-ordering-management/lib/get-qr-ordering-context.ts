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
import { QR_ORDERING_ROUTES } from "@/modules/qr-ordering-management/constants/routes";
import type { QrDashboardStats } from "@/modules/qr-ordering-management/types/qr-ordering-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  listBranchTablesForQrGeneration,
  listTableQrCodes,
} from "@/services/restaurant-qr-ordering.service";
import { getRestaurantFoundationBundle } from "@/services/restaurant-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";
import type { BranchManagementRecord } from "@/modules/branch-management/types/branch-management-types";

export interface QrOrderingPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canGenerate: boolean;
}

export interface QrOrderingContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: QrOrderingPermissions;
  branches: BranchManagementRecord[];
  selectedBranchId: string | null;
  moduleEnabled: boolean;
}

function buildQrPermissions(authorization: AuthorizationContext): QrOrderingPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.QR_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.QR_CREATE),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.QR_UPDATE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.QR_DELETE),
    canGenerate: isOwner || hasPermission(permissions, PERMISSION_CODES.QR_GENERATE),
  };
}

async function resolveQrBusiness(user: AuthUser) {
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

function computeStats(
  codes: Awaited<ReturnType<typeof listTableQrCodes>>,
  tables: Awaited<ReturnType<typeof listBranchTablesForQrGeneration>>,
): QrDashboardStats {
  return {
    totalCodes: codes.length,
    activeCodes: codes.filter((code) => code.status === "ACTIVE").length,
    inactiveCodes: codes.filter((code) => code.status === "INACTIVE").length,
    archivedCodes: codes.filter((code) => code.status === "ARCHIVED").length,
    tablesWithoutQr: tables.filter((table) => !table.hasQrCode).length,
  };
}

export const getQrOrderingContext = cache(async (branchId?: string): Promise<QrOrderingContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveQrBusiness(user);
  const permissionsFlags = buildQrPermissions(loaded.authorization);

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
});

export async function requireQrActionContext(
  branchId: string,
  permission: string,
): Promise<QrOrderingContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw permissionDenied();
  }

  const loaded = await resolveQrBusiness(user);
  const permissionsFlags = buildQrPermissions(loaded.authorization);
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

export const getQrOrderingDashboardContext = cache(async (branchId: string) => {
  const context = await getQrOrderingContext(branchId);
  const selectedBranchId = context.selectedBranchId;

  if (!selectedBranchId) {
    return {
      ...context,
      qrCodes: [],
      tables: [],
      stats: {
        totalCodes: 0,
        activeCodes: 0,
        inactiveCodes: 0,
        archivedCodes: 0,
        tablesWithoutQr: 0,
      },
    };
  }

  const [qrCodes, tables] = await Promise.all([
    listTableQrCodes(context.user.id, selectedBranchId),
    listBranchTablesForQrGeneration(context.user.id, selectedBranchId),
  ]);

  return {
    ...context,
    qrCodes,
    tables,
    stats: computeStats(qrCodes, tables),
  };
});

export const getQrPrintSheetContext = cache(async (branchId: string) => {
  const context = await getQrOrderingContext(branchId);

  if (!context.selectedBranchId) {
    redirect(QR_ORDERING_ROUTES.dashboard());
  }

  if (!context.permissionsFlags.canView) {
    redirect(ROUTES.application);
  }

  const qrCodes = await listTableQrCodes(context.user.id, context.selectedBranchId);

  return { ...context, qrCodes };
});
