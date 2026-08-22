import "server-only";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Prisma } from "@prisma/client";

/** Client-safe server action failure — never includes database internals. */
export class SafeServerActionError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "SafeServerActionError";
    this.code = code;
  }
}

const SAFE_USER_MESSAGES = new Set([
  "Business name is required",
  "Country is required",
  "Currency is required",
  "Timezone is required",
  "Selected plan is not configured",
  "Enterprise plans require custom billing. Contact Busal sales to continue.",
  "Enterprise plans require custom billing. Contact Busal sales.",
  "Selected plan does not have a fixed recurring price.",
  "Unable to start billing checkout",
  "Billing activation is required before entering the dashboard.",
  "Business not found for user",
  "Account setup is incomplete. Sign out and sign in again.",
  "Message is required",
]);

function isSafeUserMessage(message: string): boolean {
  if (SAFE_USER_MESSAGES.has(message)) {
    return true;
  }

  return (
    message.startsWith("Production billing is not configured") ||
    message.startsWith("Billing is not configured") ||
    message.startsWith("Stripe price is not configured")
  );
}

function sanitizeUnknownError(error: unknown): SafeServerActionError {
  if (error instanceof SafeServerActionError) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("[safe-server-action] database error", {
      code: error.code,
      meta: error.meta,
    });
    return new SafeServerActionError(
      "A database operation failed. Please try again.",
      "DATABASE_ERROR",
    );
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    console.error("[safe-server-action] validation error");
    return new SafeServerActionError("Invalid request data.", "VALIDATION_ERROR");
  }

  if (error instanceof Error) {
    if (isSafeUserMessage(error.message)) {
      return new SafeServerActionError(error.message, "BUSINESS_RULE");
    }

    console.error("[safe-server-action] unhandled error", {
      name: error.name,
      message: error.message,
    });
    return new SafeServerActionError("Something went wrong. Please try again.", "INTERNAL_ERROR");
  }

  console.error("[safe-server-action] unknown error", error);
  return new SafeServerActionError("Something went wrong. Please try again.", "INTERNAL_ERROR");
}

/** Runs a server action with structured logging and client-safe error surfacing. */
export async function runSafeServerAction<T>(
  actionName: string,
  handler: () => Promise<T>,
): Promise<T> {
  try {
    return await handler();
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error(`[safe-server-action:${actionName}]`, error);
    throw sanitizeUnknownError(error);
  }
}
