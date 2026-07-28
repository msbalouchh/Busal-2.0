import type { PermissionCode } from "@/modules/authorization/types/authorization";
import {
  evaluateAllPermissions as iamEvaluateAllPermissions,
  evaluateAnyPermission as iamEvaluateAnyPermission,
  evaluatePermission as iamEvaluatePermission,
  normalizePermissions,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";

export { normalizePermissions, toPermissionEvaluationContext };

export function normalizePermissionCodes(
  permissions: Iterable<PermissionCode>,
): Set<PermissionCode> {
  return normalizePermissions(permissions) as Set<PermissionCode>;
}

export function hasPermission(
  permissions: Iterable<PermissionCode>,
  permission: PermissionCode,
): boolean {
  return iamEvaluatePermission(
    toPermissionEvaluationContext({
      permissions,
      roleSlug: null,
      isOwner: false,
      businessId: null,
      branchId: null,
    }),
    permission,
  );
}

export function hasAnyPermission(
  permissions: Iterable<PermissionCode>,
  required: PermissionCode[],
): boolean {
  return iamEvaluateAnyPermission(
    toPermissionEvaluationContext({
      permissions,
      roleSlug: null,
      isOwner: false,
      businessId: null,
      branchId: null,
    }),
    required,
  );
}

export function hasAllPermissions(
  permissions: Iterable<PermissionCode>,
  required: PermissionCode[],
): boolean {
  return iamEvaluateAllPermissions(
    toPermissionEvaluationContext({
      permissions,
      roleSlug: null,
      isOwner: false,
      businessId: null,
      branchId: null,
    }),
    required,
  );
}
