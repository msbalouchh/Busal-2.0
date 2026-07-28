import {
  type BUSINESS_CONTEXT_ERROR_CODES,
  BUSINESS_CONTEXT_ERROR_MESSAGES,
} from "@/modules/business-context/constants/session";

export type BusinessContextErrorCode =
  (typeof BUSINESS_CONTEXT_ERROR_CODES)[keyof typeof BUSINESS_CONTEXT_ERROR_CODES];

export class BusinessContextError extends Error {
  readonly code: BusinessContextErrorCode;

  constructor(code: BusinessContextErrorCode, message?: string) {
    super(message ?? BUSINESS_CONTEXT_ERROR_MESSAGES[code]);
    this.name = "BusinessContextError";
    this.code = code;
  }
}

export function isBusinessContextError(error: unknown): error is BusinessContextError {
  return error instanceof BusinessContextError;
}
