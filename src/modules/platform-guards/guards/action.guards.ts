import "server-only";

import {
  evaluateRequirement as iamEvaluateRequirement,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";
import type { ProtectedActionRequirement } from "@/modules/authorization/lib/protected-action";
import type { ProtectedActionContext } from "@/modules/authorization/types/authorization";
import { logAuthorizationDecision } from "@/modules/authorization/services/authorization-logger.service";
import {
  businessNotFound,
  onboardingRequired,
  permissionDenied,
} from "@/modules/authorization/utils/authorization-errors";
import {
  requireBusinessContextForApi,
  assertUserBelongsToBusiness,
} from "@/modules/business-context/services/business-context.service";
import { assertBranchAccess } from "@/modules/business-context/utils/branch-access";
import type { PlatformContext } from "@/modules/platform-guards/types/platform-context";
import { mapToPlatformGuardError } from "@/modules/platform-guards/utils/error-mapper";
import { permissionDenied as platformPermissionDenied } from "@/modules/platform-guards/utils/platform-guard-errors";

export type { ProtectedActionRequirement };

export interface PlatformProtectedActionContext extends ProtectedActionContext {
  platform: PlatformContext;
}

function evaluateRequirement(
  platform: PlatformContext,
  requirement: ProtectedActionRequirement,
): boolean {
  return iamEvaluateRequirement(
    toPermissionEvaluationContext({
      permissions: platform.authorization.permissions,
      roleSlug: platform.authorization.roleSlug,
      isOwner: platform.authorization.isOwner,
      businessId: platform.business.id,
      branchId: platform.branchId,
    }),
    requirement,
  );
}

function normalizeRequirement(requirement: ProtectedActionRequirement): string | string[] {
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
  handler: (context: PlatformProtectedActionContext) => Promise<T>,
): Promise<T> {
  try {
    const platform = await requireBusinessContextForApi();

    if (!platform.business.id) {
      logAuthorizationDecision({
        userId: platform.user.id,
        businessId: "unknown",
        role: null,
        permission: normalizeRequirement(requirement),
        timestamp: new Date().toISOString(),
        result: "denied",
        reason: "BUSINESS_NOT_FOUND",
      });
      throw businessNotFound();
    }

    if (!platform.business.onboardingCompleted) {
      logAuthorizationDecision({
        userId: platform.user.id,
        businessId: platform.business.id,
        role: platform.roleSlug,
        permission: normalizeRequirement(requirement),
        timestamp: new Date().toISOString(),
        result: "denied",
        reason: "ONBOARDING_REQUIRED",
      });
      throw onboardingRequired();
    }

    await assertUserBelongsToBusiness(platform.user.id, platform.business.id, platform.user.email);

    if (!evaluateRequirement(platform, requirement)) {
      logAuthorizationDecision({
        userId: platform.user.id,
        businessId: platform.business.id,
        role: platform.roleSlug,
        permission: normalizeRequirement(requirement),
        timestamp: new Date().toISOString(),
        result: "denied",
        reason: "PERMISSION_DENIED",
      });
      throw permissionDenied();
    }

    assertBranchAccess(platform, platform.branchId);

    logAuthorizationDecision({
      userId: platform.user.id,
      businessId: platform.business.id,
      role: platform.roleSlug,
      permission: normalizeRequirement(requirement),
      timestamp: new Date().toISOString(),
      result: "allowed",
    });

    return handler({ ...platform.authorization, platform });
  } catch (error) {
    throw mapToPlatformGuardError(error);
  }
}

export function denyProtectedAction(message?: string): never {
  throw platformPermissionDenied(message);
}
