import {
  PLATFORM_GUARD_ERROR_CODES,
  PLATFORM_GUARD_ERROR_MESSAGES,
} from "@/modules/platform-guards/constants/errors";

export type PlatformGuardErrorCode =
  (typeof PLATFORM_GUARD_ERROR_CODES)[keyof typeof PLATFORM_GUARD_ERROR_CODES];

export class PlatformGuardError extends Error {
  readonly code: PlatformGuardErrorCode;

  constructor(code: PlatformGuardErrorCode, message?: string) {
    super(message ?? PLATFORM_GUARD_ERROR_MESSAGES[code]);
    this.name = "PlatformGuardError";
    this.code = code;
  }
}

export function isPlatformGuardError(error: unknown): error is PlatformGuardError {
  return error instanceof PlatformGuardError;
}

export function unauthenticated(message?: string): PlatformGuardError {
  return new PlatformGuardError(PLATFORM_GUARD_ERROR_CODES.UNAUTHENTICATED, message);
}

export function businessRequired(message?: string): PlatformGuardError {
  return new PlatformGuardError(PLATFORM_GUARD_ERROR_CODES.BUSINESS_REQUIRED, message);
}

export function businessNotActive(message?: string): PlatformGuardError {
  return new PlatformGuardError(PLATFORM_GUARD_ERROR_CODES.BUSINESS_NOT_ACTIVE, message);
}

export function staffInactive(message?: string): PlatformGuardError {
  return new PlatformGuardError(PLATFORM_GUARD_ERROR_CODES.STAFF_INACTIVE, message);
}

export function onboardingRequired(message?: string): PlatformGuardError {
  return new PlatformGuardError(PLATFORM_GUARD_ERROR_CODES.ONBOARDING_REQUIRED, message);
}

export function permissionDenied(message?: string): PlatformGuardError {
  return new PlatformGuardError(PLATFORM_GUARD_ERROR_CODES.PERMISSION_DENIED, message);
}

export function roleRequired(message?: string): PlatformGuardError {
  return new PlatformGuardError(PLATFORM_GUARD_ERROR_CODES.ROLE_REQUIRED, message);
}
