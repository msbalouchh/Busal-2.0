import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { OmsPlatformContext } from "@/modules/orders/types/order";
import { prisma } from "@/lib/prisma";

export interface OrderTenantScope {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
}

export function resolveOrderScope(platform: BusinessContext): OrderTenantScope {
  const businessId = platform.business.id;
  const branchId = platform.branchId ?? platform.branch?.id;

  if (!branchId) {
    throw new Error("Branch context is required for order management");
  }

  return {
    tenantId: businessId,
    workspaceId: businessId,
    businessId,
    branchId,
    userId: platform.user.id,
  };
}

export function toOmsPlatformContext(scope: OrderTenantScope): OmsPlatformContext {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    userId: scope.userId,
  };
}

export function buildOrderScopeFromInput(input: {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId: string;
  userId?: string;
}): OrderTenantScope {
  return {
    tenantId: input.tenantId ?? input.businessId,
    workspaceId: input.workspaceId ?? input.businessId,
    businessId: input.businessId,
    branchId: input.branchId,
    userId: input.userId ?? "system",
  };
}

/** Resolves order scope for API integrations using the tenant's primary branch. */
export async function resolveOrderScopeFromBusiness(
  businessId: string,
): Promise<OrderTenantScope> {
  const branch =
    (await prisma.branch.findFirst({
      where: { businessId, isMain: true, isActive: true },
      select: { id: true },
    })) ??
    (await prisma.branch.findFirst({
      where: { businessId, isActive: true },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }));

  if (!branch) {
    throw new Error("No active branch found for business");
  }

  return buildOrderScopeFromInput({
    businessId,
    branchId: branch.id,
  });
}
