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
import { PAYMENT_RECEIPT_ROUTES } from "@/modules/payment-receipt-management/constants/routes";
import type { OrderPaymentListQuery } from "@/modules/payment-receipt-management/types/payment-receipt-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getOrderPayment,
  getPaymentDashboardStats,
  listOrderPayments,
  listUnpaidOrders,
} from "@/services/restaurant-payment.service";
import { getRestaurantFoundationBundle } from "@/services/restaurant-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";
import type { BranchManagementRecord } from "@/modules/branch-management/types/branch-management-types";

export interface PaymentReceiptPermissions {
  canView: boolean;
  canCreate: boolean;
  canRefund: boolean;
  canVoid: boolean;
  canPrintReceipt: boolean;
  canEmailReceipt: boolean;
  canViewReceipt: boolean;
}

export interface PaymentReceiptContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: PaymentReceiptPermissions;
  branches: BranchManagementRecord[];
  selectedBranchId: string | null;
  moduleEnabled: boolean;
}

function buildPaymentPermissions(authorization: AuthorizationContext): PaymentReceiptPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.PAYMENT_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.PAYMENT_CREATE),
    canRefund: isOwner || hasPermission(permissions, PERMISSION_CODES.PAYMENT_REFUND),
    canVoid: isOwner || hasPermission(permissions, PERMISSION_CODES.PAYMENT_VOID),
    canPrintReceipt: isOwner || hasPermission(permissions, PERMISSION_CODES.RECEIPT_PRINT),
    canEmailReceipt: isOwner || hasPermission(permissions, PERMISSION_CODES.RECEIPT_EMAIL),
    canViewReceipt: isOwner || hasPermission(permissions, PERMISSION_CODES.RECEIPT_VIEW),
  };
}

async function resolvePaymentBusiness(user: AuthUser) {
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

export const getPaymentReceiptContext = cache(
  async (branchId?: string): Promise<PaymentReceiptContext> => {
    const user = await requireApplicationAccess();
    const loaded = await resolvePaymentBusiness(user);
    const permissionsFlags = buildPaymentPermissions(loaded.authorization);

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

export async function requirePaymentActionContext(
  branchId: string,
  permission: string,
): Promise<PaymentReceiptContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw permissionDenied();
  }

  const loaded = await resolvePaymentBusiness(user);
  const permissionsFlags = buildPaymentPermissions(loaded.authorization);
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

export const getPaymentDashboardContext = cache(
  async (branchId: string, search?: string, status?: OrderPaymentListQuery["status"]) => {
    const context = await getPaymentReceiptContext(branchId);
    const selectedBranchId = context.selectedBranchId;

    if (!selectedBranchId) {
      return {
        ...context,
        payments: [],
        stats: {
          paymentsToday: 0,
          revenueToday: 0,
          refundsToday: 0,
          unpaidOrders: 0,
        },
        unpaidOrders: [],
      };
    }

    const query: OrderPaymentListQuery = {
      branchId: selectedBranchId,
      search,
      status,
    };

    const [paymentResult, stats, unpaidOrders] = await Promise.all([
      listOrderPayments(context.user.id, query),
      getPaymentDashboardStats(context.user.id, selectedBranchId),
      listUnpaidOrders(context.user.id, selectedBranchId),
    ]);

    return {
      ...context,
      payments: paymentResult.items,
      paymentPagination: paymentResult,
      stats,
      unpaidOrders,
    };
  },
);

export const getPaymentDetailsContext = cache(async (branchId: string, paymentId: string) => {
  const context = await getPaymentReceiptContext(branchId);

  if (!context.selectedBranchId) {
    redirect(PAYMENT_RECEIPT_ROUTES.dashboard());
  }

  const payment = await getOrderPayment(context.user.id, context.selectedBranchId, paymentId);

  return { ...context, payment };
});

export const getReceiptViewerContext = cache(async (branchId: string, receiptId: string) => {
  const context = await getPaymentReceiptContext(branchId);

  if (!context.permissionsFlags.canViewReceipt) {
    redirect(PAYMENT_RECEIPT_ROUTES.dashboard());
  }

  const { getOrderReceipt } = await import("@/services/restaurant-order-receipt.service");
  const receipt = await getOrderReceipt(receiptId, context.business.id);

  return { ...context, receipt };
});
