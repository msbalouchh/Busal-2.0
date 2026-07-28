import {
  AUTHORIZATION_ERROR_CODES,
  AUTHORIZATION_ERROR_MESSAGES,
} from "@/modules/authorization/constants/permissions";
import type { AuthorizationErrorCode } from "@/modules/authorization/types/authorization";

export class AuthorizationError extends Error {
  readonly code: AuthorizationErrorCode;

  constructor(code: AuthorizationErrorCode, message?: string) {
    super(message ?? AUTHORIZATION_ERROR_MESSAGES[code]);
    this.name = "AuthorizationError";
    this.code = code;
  }
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

export function unauthorized(message?: string): AuthorizationError {
  return new AuthorizationError(AUTHORIZATION_ERROR_CODES.UNAUTHORIZED, message);
}

export function forbidden(message?: string): AuthorizationError {
  return new AuthorizationError(AUTHORIZATION_ERROR_CODES.FORBIDDEN, message);
}

export function businessNotFound(message?: string): AuthorizationError {
  return new AuthorizationError(AUTHORIZATION_ERROR_CODES.BUSINESS_NOT_FOUND, message);
}

export function onboardingRequired(message?: string): AuthorizationError {
  return new AuthorizationError(AUTHORIZATION_ERROR_CODES.ONBOARDING_REQUIRED, message);
}

export function permissionDenied(message?: string): AuthorizationError {
  return new AuthorizationError(AUTHORIZATION_ERROR_CODES.PERMISSION_DENIED, message);
}
