import type { Prisma } from "@prisma/client";

/** Branch filter for queries: matches branch-specific and business-wide (null) records. */
export function branchScope(branchId: string | null): { OR: Array<{ branchId: string | null }> } {
  if (!branchId) {
    return { OR: [{ branchId: null }] };
  }

  return {
    OR: [{ branchId: null }, { branchId }],
  };
}

/** Strict branch filter for branch-owned records (orders, tables, etc.). */
export function branchFilter(branchId: string | null): { branchId?: string } {
  if (!branchId) {
    return {};
  }

  return { branchId };
}

export function mergeRestaurantOrderWhere<T extends Prisma.RestaurantOrderWhereInput>(
  businessId: string,
  branchId: string | null,
  extra?: T,
): Prisma.RestaurantOrderWhereInput {
  return {
    businessId,
    ...branchFilter(branchId),
    ...extra,
  };
}

/** @deprecated Use mergeRestaurantOrderWhere */
export function mergeBranchWhere<T extends Prisma.RestaurantOrderWhereInput>(
  businessId: string,
  branchId: string | null,
  extra?: T,
): Prisma.RestaurantOrderWhereInput {
  return mergeRestaurantOrderWhere(businessId, branchId, extra);
}

export interface BranchScopeInput {
  businessId: string;
  branchId: string | null;
}

export function toBranchScope(context: {
  business: { id: string };
  branchId: string | null;
}): BranchScopeInput {
  return {
    businessId: context.business.id,
    branchId: context.branchId,
  };
}
