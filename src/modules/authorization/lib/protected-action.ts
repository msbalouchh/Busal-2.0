import "server-only";

import { logAuthorizationDecision } from "@/modules/authorization/services/authorization-logger.service";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isBusinessActive,
  resolveAuthorizationContext,
} from "@/modules/authorization/services/authorization.service";
import type {
  AuthorizationContext,
  PermissionCode,
  ProtectedActionContext,
} from "@/modules/authorization/types/authorization";
import {
  businessNotFound,
  onboardingRequired,
  permissionDenied,
  unauthorized,
} from "@/modules/authorization/utils/authorization-errors";
import { resolveBusinessForCurrentUser } from "@/modules/authorization/services/authorization.service";
import { getCurrentUser } from "@/services/auth.service";

export type ProtectedActionRequirement =
  PermissionCode | PermissionCode[] | { any: PermissionCode[] } | { all: PermissionCode[] };

function evaluateRequirement(
  permissions: Set<PermissionCode>,
  requirement: ProtectedActionRequirement,
): boolean {
  if (typeof requirement === "string") {
    return hasPermission(permissions, requirement);
  }

  if (Array.isArray(requirement)) {
    return hasAnyPermission(permissions, requirement);
  }

  if ("any" in requirement) {
    return hasAnyPermission(permissions, requirement.any);
  }

  return hasAllPermissions(permissions, requirement.all);
}

function normalizeRequirement(
  requirement: ProtectedActionRequirement,
): PermissionCode | PermissionCode[] {
  if (typeof requirement === "string") {
    return requirement;
  }

  if (Array.isArray(requirement)) {
    return requirement;
  }

  return "any" in requirement ? requirement.any : requirement.all;
}

export async function protectedAction<T>(
  requirement: ProtectedActionRequirement,
  handler: (context: ProtectedActionContext) => Promise<T>,
): Promise<T> {
  const user = await getCurrentUser();

  if (!user) {
    logAuthorizationDecision({
      userId: "anonymous",
      businessId: "unknown",
      role: null,
      permission: normalizeRequirement(requirement),
      timestamp: new Date().toISOString(),
      result: "denied",
      reason: "UNAUTHORIZED",
    });
    throw unauthorized();
  }

  const business = await resolveBusinessForCurrentUser();

  if (!business.id) {
    logAuthorizationDecision({
      userId: user.id,
      businessId: "unknown",
      role: null,
      permission: normalizeRequirement(requirement),
      timestamp: new Date().toISOString(),
      result: "denied",
      reason: "BUSINESS_NOT_FOUND",
    });
    throw businessNotFound();
  }

  const active = await isBusinessActive(business.id);

  if (!active) {
    logAuthorizationDecision({
      userId: user.id,
      businessId: business.id,
      role: null,
      permission: normalizeRequirement(requirement),
      timestamp: new Date().toISOString(),
      result: "denied",
      reason: "ONBOARDING_REQUIRED",
    });
    throw onboardingRequired();
  }

  const context: AuthorizationContext = await resolveAuthorizationContext(user, business);

  if (!evaluateRequirement(context.permissions, requirement)) {
    logAuthorizationDecision({
      userId: user.id,
      businessId: business.id,
      role: context.roleSlug,
      permission: normalizeRequirement(requirement),
      timestamp: new Date().toISOString(),
      result: "denied",
      reason: "PERMISSION_DENIED",
    });
    throw permissionDenied();
  }

  logAuthorizationDecision({
    userId: user.id,
    businessId: business.id,
    role: context.roleSlug,
    permission: normalizeRequirement(requirement),
    timestamp: new Date().toISOString(),
    result: "allowed",
  });

  return handler(context);
}
