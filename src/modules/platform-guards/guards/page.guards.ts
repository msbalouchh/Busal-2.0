import "server-only";

import { isRedirectError } from "next/dist/client/components/redirect-error";

import {
  evaluateAllPermissions as iamEvaluateAllPermissions,
  evaluateAnyPermission as iamEvaluateAnyPermission,
  evaluatePermission as iamEvaluatePermission,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";
import { requireBusinessContext } from "@/modules/platform-guards/guards/business.guards";
import {
  assertBusinessActive,
  assertBusinessSelected,
} from "@/modules/platform-guards/guards/business.guards";
import { assertStaffActive } from "@/modules/platform-guards/guards/staff.guards";
import type {
  PlatformContext,
  PlatformPageGuardOptions,
} from "@/modules/platform-guards/types/platform-context";
import { mapToPlatformGuardError } from "@/modules/platform-guards/utils/error-mapper";
import {
  onboardingRequired,
  permissionDenied,
  roleRequired,
} from "@/modules/platform-guards/utils/platform-guard-errors";

function assertRoleResolved(context: PlatformContext): void {
  if (!context.roleSlug) {
    throw roleRequired();
  }
}

function assertPermissionsLoaded(context: PlatformContext): void {
  if (!context.isOwner && context.permissions.length === 0) {
    throw permissionDenied();
  }
}

function assertOnboardingComplete(context: PlatformContext): void {
  if (!context.business.onboardingCompleted) {
    throw onboardingRequired();
  }
}

function buildPermissionEvaluationContext(context: PlatformContext) {
  return toPermissionEvaluationContext({
    permissions: context.authorization.permissions,
    roleSlug: context.authorization.roleSlug,
    isOwner: context.isOwner,
    businessId: context.business.id,
    branchId: context.branchId,
  });
}

function assertPageAuthorization(
  context: PlatformContext,
  options: PlatformPageGuardOptions = {},
): void {
  if (options.role && context.roleSlug !== options.role && !context.isOwner) {
    throw roleRequired();
  }

  const permissionContext = buildPermissionEvaluationContext(context);

  if (
    options.permission &&
    !iamEvaluatePermission(permissionContext, options.permission)
  ) {
    throw permissionDenied();
  }

  if (options.permissions?.length) {
    const allowed = options.requireAll
      ? iamEvaluateAllPermissions(permissionContext, options.permissions)
      : iamEvaluateAnyPermission(permissionContext, options.permissions);

    if (!allowed) {
      throw permissionDenied();
    }
  }
}

export async function protectedPage(
  options: PlatformPageGuardOptions = {},
): Promise<PlatformContext> {
  try {
    const context = await requireBusinessContext();

    assertBusinessSelected(context);
    assertBusinessActive(context);
    assertOnboardingComplete(context);
    assertStaffActive(context);
    assertRoleResolved(context);
    assertPermissionsLoaded(context);
    assertPageAuthorization(context, options);

    if (context.branchId) {
      const { assertBranchAccess } = await import("@/modules/business-context/utils/branch-access");
      assertBranchAccess(context, context.branchId);
    }

    return context;
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    throw mapToPlatformGuardError(error);
  }
}
