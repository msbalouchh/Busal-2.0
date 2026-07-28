import { AUTHORIZATION_ERROR_CODES } from "@/modules/authorization/constants/permissions";
import { AuthorizationError } from "@/modules/authorization/utils/authorization-errors";
import { BusinessContextError } from "@/modules/business-context/utils/business-context-errors";
import { PLATFORM_GUARD_ERROR_CODES } from "@/modules/platform-guards/constants/errors";
import {
  PlatformGuardError,
  businessNotActive,
  businessRequired,
  onboardingRequired,
  permissionDenied,
  staffInactive,
  unauthenticated,
} from "@/modules/platform-guards/utils/platform-guard-errors";
import { STAFF_AUTH_ERROR_CODES } from "@/modules/staff-auth/constants/session";
import { StaffAuthError } from "@/modules/staff-auth/utils/staff-auth-errors";

export function mapToPlatformGuardError(error: unknown): PlatformGuardError {
  if (error instanceof PlatformGuardError) {
    return error;
  }

  if (error instanceof AuthorizationError) {
    switch (error.code) {
      case AUTHORIZATION_ERROR_CODES.UNAUTHORIZED:
        return unauthenticated(error.message);
      case AUTHORIZATION_ERROR_CODES.BUSINESS_NOT_FOUND:
        return businessRequired(error.message);
      case AUTHORIZATION_ERROR_CODES.ONBOARDING_REQUIRED:
        return onboardingRequired(error.message);
      case AUTHORIZATION_ERROR_CODES.PERMISSION_DENIED:
      case AUTHORIZATION_ERROR_CODES.FORBIDDEN:
        return permissionDenied(error.message);
      default:
        return permissionDenied(error.message);
    }
  }

  if (error instanceof BusinessContextError) {
    switch (error.code) {
      case "UNAUTHORIZED":
        return unauthenticated(error.message);
      case "BUSINESS_NOT_FOUND":
      case "INVALID_CONTEXT":
        return businessRequired(error.message);
      case "BUSINESS_INACTIVE":
        return businessNotActive(error.message);
      case "CROSS_BUSINESS_ACCESS":
        return permissionDenied(error.message);
      default:
        return businessRequired(error.message);
    }
  }

  if (error instanceof StaffAuthError) {
    switch (error.code) {
      case STAFF_AUTH_ERROR_CODES.SESSION_INVALID:
      case STAFF_AUTH_ERROR_CODES.STAFF_NOT_FOUND:
        return unauthenticated(error.message);
      case STAFF_AUTH_ERROR_CODES.STAFF_INACTIVE:
        return staffInactive(error.message);
      case STAFF_AUTH_ERROR_CODES.BUSINESS_INACTIVE:
        return businessNotActive(error.message);
      case STAFF_AUTH_ERROR_CODES.BUSINESS_NOT_FOUND:
        return businessRequired(error.message);
      default:
        return permissionDenied(error.message);
    }
  }

  if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT:")) {
    return unauthenticated();
  }

  if (error instanceof Error) {
    return new PlatformGuardError(PLATFORM_GUARD_ERROR_CODES.PERMISSION_DENIED, error.message);
  }

  return permissionDenied();
}
