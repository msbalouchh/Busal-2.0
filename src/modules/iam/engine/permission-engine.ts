import type { PermissionCode } from "@/modules/authorization/types/authorization";
import type { PermissionEvaluationContext } from "@/modules/iam/types/iam-types";

export function normalizePermissions(permissions: Iterable<string>): Set<string> {
  return new Set(permissions);
}

export function evaluatePermission(
  context: PermissionEvaluationContext,
  permission: PermissionCode | string,
): boolean {
  if (context.isOwner) {
    return true;
  }

  return normalizePermissions(context.permissions).has(permission);
}

export function evaluateAnyPermission(
  context: PermissionEvaluationContext,
  required: string[],
): boolean {
  if (context.isOwner) {
    return true;
  }

  const granted = normalizePermissions(context.permissions);
  return required.some((permission) => granted.has(permission));
}

export function evaluateAllPermissions(
  context: PermissionEvaluationContext,
  required: string[],
): boolean {
  if (context.isOwner) {
    return true;
  }

  const granted = normalizePermissions(context.permissions);
  return required.every((permission) => granted.has(permission));
}

export function evaluateResourcePermission(
  context: PermissionEvaluationContext,
  permission: string,
  input: { businessId?: string | null; branchId?: string | null },
): boolean {
  if (!evaluatePermission(context, permission)) {
    return false;
  }

  if (input.businessId && context.businessId && input.businessId !== context.businessId) {
    return false;
  }

  if (input.branchId && context.branchId && input.branchId !== context.branchId) {
    return false;
  }

  return true;
}

export function evaluateRequirement(
  context: PermissionEvaluationContext,
  requirement: string | string[] | { any: string[] } | { all: string[] },
): boolean {
  if (typeof requirement === "string") {
    return evaluatePermission(context, requirement);
  }

  if (Array.isArray(requirement)) {
    return evaluateAnyPermission(context, requirement);
  }

  if ("any" in requirement) {
    return evaluateAnyPermission(context, requirement.any);
  }

  return evaluateAllPermissions(context, requirement.all);
}

export function toPermissionEvaluationContext(input: {
  permissions: Iterable<string>;
  roleSlug: string | null;
  isOwner: boolean;
  businessId: string | null;
  branchId: string | null;
}): PermissionEvaluationContext {
  return {
    permissions: input.permissions,
    roleSlug: input.roleSlug,
    isOwner: input.isOwner,
    businessId: input.businessId,
    branchId: input.branchId,
  };
}
