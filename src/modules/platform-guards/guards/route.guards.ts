import "server-only";

import { protectApiRoute } from "@/modules/authorization/guards/permission-guards";
import { assertUserBelongsToBusiness } from "@/modules/business-context/services/business-context.service";
import { requireBusinessContextForPlatformApi } from "@/modules/platform-guards/guards/business.guards";
import {
  assertBusinessActive,
  assertBusinessSelected,
} from "@/modules/platform-guards/guards/business.guards";
import { assertStaffActive } from "@/modules/platform-guards/guards/staff.guards";
import type {
  PlatformContext,
  PlatformRouteGuardOptions,
} from "@/modules/platform-guards/types/platform-context";
import { mapToPlatformGuardError } from "@/modules/platform-guards/utils/error-mapper";
import {
  onboardingRequired,
  permissionDenied,
  roleRequired,
} from "@/modules/platform-guards/utils/platform-guard-errors";
import { NextResponse } from "next/server";

import { PLATFORM_GUARD_ERROR_CODES } from "@/modules/platform-guards/constants/errors";
import { isPlatformGuardError } from "@/modules/platform-guards/utils/platform-guard-errors";

function platformGuardStatus(code: string): number {
  switch (code) {
    case PLATFORM_GUARD_ERROR_CODES.UNAUTHENTICATED:
      return 401;
    case PLATFORM_GUARD_ERROR_CODES.PERMISSION_DENIED:
    case PLATFORM_GUARD_ERROR_CODES.ROLE_REQUIRED:
    case PLATFORM_GUARD_ERROR_CODES.STAFF_INACTIVE:
      return 403;
    case PLATFORM_GUARD_ERROR_CODES.BUSINESS_REQUIRED:
    case PLATFORM_GUARD_ERROR_CODES.BUSINESS_NOT_ACTIVE:
    case PLATFORM_GUARD_ERROR_CODES.ONBOARDING_REQUIRED:
      return 403;
    default:
      return 403;
  }
}

export function platformGuardErrorResponse(error: unknown): NextResponse {
  const mapped = mapToPlatformGuardError(error);

  return NextResponse.json(
    {
      success: false,
      error: mapped.message,
      code: mapped.code,
    },
    { status: platformGuardStatus(mapped.code) },
  );
}

export function handlePlatformRouteError(error: unknown): NextResponse {
  if (isPlatformGuardError(error)) {
    return platformGuardErrorResponse(error);
  }

  return platformGuardErrorResponse(error);
}

export async function protectedRoute(
  options: PlatformRouteGuardOptions = {},
): Promise<PlatformContext> {
  try {
    const context = await requireBusinessContextForPlatformApi();

    assertBusinessSelected(context);
    assertBusinessActive(context);

    if (!context.business.onboardingCompleted) {
      throw onboardingRequired();
    }

    assertStaffActive(context);

    if (context.branchId) {
      const { assertBranchAccess } = await import("@/modules/business-context/utils/branch-access");
      assertBranchAccess(context, context.branchId);
    }

    if (!context.roleSlug) {
      throw roleRequired();
    }

    if (!context.isOwner && context.permissions.length === 0) {
      throw permissionDenied();
    }

    await assertUserBelongsToBusiness(context.user.id, context.business.id, context.user.email);
    await protectApiRoute(options);

    return context;
  } catch (error) {
    throw mapToPlatformGuardError(error);
  }
}
