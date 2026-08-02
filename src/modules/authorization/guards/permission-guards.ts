import "server-only";

import { logAuthorizationDecision } from "@/modules/authorization/services/authorization-logger.service";
import {
  buildAuthorizationContextForCurrentUser,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isBusinessActive,
  resolveBusinessForCurrentUser,
} from "@/modules/authorization/services/authorization.service";
import { hasRole } from "@/modules/authorization/utils/role-utils";
import {
  ensureStaffDashboardAccess,
  protectStaffApiRoute,
} from "@/modules/staff-auth/guards/staff-auth-guard";
import {
  businessNotFound,
  onboardingRequired,
  permissionDenied,
  unauthorized,
} from "@/modules/authorization/utils/authorization-errors";
import type {
  AuthorizationContext,
  PermissionCode,
  RouteGuardOptions,
} from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

function logDecision(
  context: AuthorizationContext | null,
  permission: PermissionCode | PermissionCode[] | null,
  result: "allowed" | "denied",
  reason?: AuthorizationContext extends never ? never : string,
) {
  logAuthorizationDecision({
    userId: context?.user.id ?? "anonymous",
    businessId: context?.business.id ?? "unknown",
    role: context?.roleSlug ?? null,
    permission,
    timestamp: new Date().toISOString(),
    result,
    reason: reason as never,
  });
}

export async function requireBusiness(): Promise<{
  user: AuthUser;
  business: BusinessProfileData & { id: string };
}> {
  const user = await getCurrentUser();

  if (!user) {
    throw unauthorized();
  }

  const business = await resolveBusinessForCurrentUser();

  if (!business.id) {
    throw businessNotFound();
  }

  const active = await isBusinessActive(business.id);

  if (!active) {
    throw onboardingRequired();
  }

  return { user, business };
}

export async function requireRole(roleSlug: string): Promise<AuthorizationContext> {
  const context = await buildAuthorizationContextForCurrentUser();

  if (!hasRole(context, roleSlug)) {
    logDecision(context, null, "denied", "FORBIDDEN");
    throw permissionDenied();
  }

  logDecision(context, null, "allowed");
  return context;
}

export async function requirePermission(permission: PermissionCode): Promise<AuthorizationContext> {
  const context = await buildAuthorizationContextForCurrentUser();

  if (!hasPermission(context.permissions, permission)) {
    logDecision(context, permission, "denied", "PERMISSION_DENIED");
    throw permissionDenied();
  }

  logDecision(context, permission, "allowed");
  return context;
}

export async function requireAnyPermission(
  permissions: PermissionCode[],
): Promise<AuthorizationContext> {
  const context = await buildAuthorizationContextForCurrentUser();

  if (!hasAnyPermission(context.permissions, permissions)) {
    logDecision(context, permissions, "denied", "PERMISSION_DENIED");
    throw permissionDenied();
  }

  logDecision(context, permissions, "allowed");
  return context;
}

export async function requireAllPermissions(
  permissions: PermissionCode[],
): Promise<AuthorizationContext> {
  const context = await buildAuthorizationContextForCurrentUser();

  if (!hasAllPermissions(context.permissions, permissions)) {
    logDecision(context, permissions, "denied", "PERMISSION_DENIED");
    throw permissionDenied();
  }

  logDecision(context, permissions, "allowed");
  return context;
}

export async function protectDashboardRoute(
  options: RouteGuardOptions = {},
): Promise<AuthorizationContext> {
  const { authorization: context } = await ensureStaffDashboardAccess();

  if (options.role && context.roleSlug !== options.role && !context.isOwner) {
    logDecision(context, null, "denied", "FORBIDDEN");
    throw permissionDenied();
  }

  if (options.permission && !hasPermission(context.permissions, options.permission)) {
    logDecision(context, options.permission, "denied", "PERMISSION_DENIED");
    throw permissionDenied();
  }

  if (options.permissions?.length) {
    const allowed = options.requireAll
      ? hasAllPermissions(context.permissions, options.permissions)
      : hasAnyPermission(context.permissions, options.permissions);

    if (!allowed) {
      logDecision(context, options.permissions, "denied", "PERMISSION_DENIED");
      throw permissionDenied();
    }
  }

  logDecision(context, options.permission ?? options.permissions ?? null, "allowed");
  return context;
}

export async function protectServerComponent(
  options: RouteGuardOptions = {},
): Promise<AuthorizationContext> {
  return protectDashboardRoute(options);
}

export async function protectApiRoute(
  options: RouteGuardOptions = {},
): Promise<AuthorizationContext> {
  const { authorization: context } = await protectStaffApiRoute();

  if (options.permission && !hasPermission(context.permissions, options.permission)) {
    logDecision(context, options.permission, "denied", "PERMISSION_DENIED");
    throw permissionDenied();
  }

  if (options.permissions?.length) {
    const allowed = options.requireAll
      ? hasAllPermissions(context.permissions, options.permissions)
      : hasAnyPermission(context.permissions, options.permissions);

    if (!allowed) {
      logDecision(context, options.permissions, "denied", "PERMISSION_DENIED");
      throw permissionDenied();
    }
  }

  logDecision(context, options.permission ?? options.permissions ?? null, "allowed");
  return context;
}
