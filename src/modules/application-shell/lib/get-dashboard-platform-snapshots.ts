import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { buildRbacFoundationSnapshot } from "@/modules/rbac/services/rbac-foundation.service";
import { getTenantFoundationData } from "@/modules/tenant/lib/get-tenant-foundation-data";
import type { RbacSnapshot } from "@/modules/rbac/types/context";
import type { TenantSnapshot } from "@/modules/tenant/types/context";

export interface DashboardPlatformSnapshots {
  tenant: TenantSnapshot;
  rbac: RbacSnapshot;
}

export async function getDashboardPlatformSnapshots(
  context: BusinessContext,
): Promise<DashboardPlatformSnapshots> {
  const [tenant, rbac] = await Promise.all([
    getTenantFoundationData(context),
    buildRbacFoundationSnapshot({
      userId: context.user.id,
      businessId: context.business.id,
      branchId: context.branchId,
    }),
  ]);

  return { tenant, rbac };
}
