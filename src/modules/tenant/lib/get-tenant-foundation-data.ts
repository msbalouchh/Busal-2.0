import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { tenantFoundationService } from "@/modules/tenant/services/tenant-foundation.service";
import type { TenantSnapshot } from "@/modules/tenant/types/context";

/** Loads production tenant foundation snapshot for the active business context. */
export async function getTenantFoundationData(
  context: BusinessContext,
): Promise<TenantSnapshot> {
  return tenantFoundationService.buildSnapshotForBusiness(
    context.business.id,
    context.branchId ?? undefined,
  );
}
