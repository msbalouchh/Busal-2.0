import "server-only";

import { isRedirectError } from "next/dist/client/components/redirect-error";

import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "@/modules/authorization/services/authorization.service";
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

function assertPageAuthorization(
  context: PlatformContext,
  options: PlatformPageGuardOptions = {},
): void {
  if (options.role && context.roleSlug !== options.role && !context.isOwner) {
    throw roleRequired();
  }

  if (options.permission && !hasPermission(context.authorization.permissions, options.permission)) {
    throw permissionDenied();
  }

  if (options.permissions?.length) {
    const allowed = options.requireAll
      ? hasAllPermissions(context.authorization.permissions, options.permissions)
      : hasAnyPermission(context.authorization.permissions, options.permissions);

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
