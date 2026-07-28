import {
  type STAFF_AUTH_ERROR_CODES,
  STAFF_AUTH_ERROR_MESSAGES,
} from "@/modules/staff-auth/constants/session";

export type StaffAuthErrorCode =
  (typeof STAFF_AUTH_ERROR_CODES)[keyof typeof STAFF_AUTH_ERROR_CODES];

export class StaffAuthError extends Error {
  readonly code: StaffAuthErrorCode;

  constructor(code: StaffAuthErrorCode, message?: string) {
    super(message ?? STAFF_AUTH_ERROR_MESSAGES[code]);
    this.name = "StaffAuthError";
    this.code = code;
  }
}

export function isStaffAuthError(error: unknown): error is StaffAuthError {
  return error instanceof StaffAuthError;
}
