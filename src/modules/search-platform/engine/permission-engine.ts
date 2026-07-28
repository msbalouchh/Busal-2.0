import {
  evaluatePermission,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";
import type { PermissionEvaluationContext } from "@/modules/iam/types/iam-types";

import type { SearchIndexRecordCandidate } from "@/modules/search-platform/engine/search-engine";

export interface SearchPermissionContext {
  permissions: string[];
  roleSlug: string | null;
  isOwner: boolean;
  businessId: string;
  branchId?: string | null;
}

export function toSearchPermissionContext(
  input: SearchPermissionContext,
): PermissionEvaluationContext {
  return toPermissionEvaluationContext({
    permissions: input.permissions,
    roleSlug: input.roleSlug,
    isOwner: input.isOwner,
    businessId: input.businessId,
    branchId: input.branchId ?? null,
  });
}

export function canAccessSearchRecord(
  context: SearchPermissionContext,
  record: Pick<SearchIndexRecordCandidate, "requiredPermission" | "branchId"> & {
    requiredPermission?: string | null;
  },
): boolean {
  const permissionContext = toSearchPermissionContext(context);

  if (
    record.requiredPermission &&
    !evaluatePermission(permissionContext, record.requiredPermission)
  ) {
    return false;
  }

  if (context.branchId && record.branchId && record.branchId !== context.branchId) {
    const hasBranchAccess = evaluatePermission(permissionContext, "branch.access");
    if (!hasBranchAccess && !context.isOwner) {
      return false;
    }
  }

  return true;
}

export function filterSearchRecordsByPermission<
  T extends SearchIndexRecordCandidate & { requiredPermission?: string | null },
>(context: SearchPermissionContext, records: T[]): T[] {
  return records.filter((record) => canAccessSearchRecord(context, record));
}
