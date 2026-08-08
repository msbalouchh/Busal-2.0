import type { PrismaClient } from "@prisma/client";

export class EnvironmentFailureError extends Error {
  readonly code = "ENVIRONMENT_FAILURE";

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "EnvironmentFailureError";
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export function isTransientDatabaseError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as { code?: string; name?: string; message?: string };
  const code = record.code ?? "";
  const message = record.message ?? "";

  if (["P1001", "P1002", "P1017", "P2028", "P2034"].includes(code)) {
    return true;
  }

  if (record.name === "PrismaClientInitializationError") {
    return true;
  }

  return (
    message.includes("Can't reach database server") ||
    message.includes("Connection terminated") ||
    message.includes("Connection reset") ||
    message.includes("pool timeout") ||
    message.includes("Transaction already closed") ||
    message.includes("Transaction not found") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT")
  );
}

/** @deprecated Use isTransientDatabaseError */
export function isPrismaConnectionError(error: unknown): boolean {
  return isTransientDatabaseError(error);
}

export function isEnvironmentFailure(error: unknown): error is EnvironmentFailureError {
  return (
    error instanceof EnvironmentFailureError ||
    (typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ENVIRONMENT_FAILURE")
  );
}

export async function connectWithRetry(
  prisma: PrismaClient,
  options: { maxAttempts?: number; delayMs?: number } = {},
): Promise<void> {
  const maxAttempts = options.maxAttempts ?? 5;
  const delayMs = options.delayMs ?? 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (error) {
      if (!isTransientDatabaseError(error)) {
        throw error;
      }

      if (attempt === maxAttempts) {
        throw new EnvironmentFailureError(
          `Database unavailable after ${maxAttempts} connection attempts`,
          error,
        );
      }

      await new Promise((resolve) => {
        setTimeout(resolve, delayMs * attempt);
      });
    }
  }
}

export async function withDatabaseVerification<T>(
  prisma: PrismaClient,
  fn: () => Promise<T>,
  options: { maxAttempts?: number; delayMs?: number } = {},
): Promise<T> {
  await connectWithRetry(prisma, options);

  try {
    return await fn();
  } catch (error) {
    if (isTransientDatabaseError(error)) {
      throw new EnvironmentFailureError("Database connection lost during verification", error);
    }

    throw error;
  }
}

export function handleVerificationError(error: unknown): never {
  if (isEnvironmentFailure(error)) {
    console.error(`ENVIRONMENT_FAILURE: ${error.message}`);
    process.exit(2);
  }

  if (isTransientDatabaseError(error)) {
    const message =
      error instanceof Error ? error.message : "Database connection unavailable during verification";
    console.error(`ENVIRONMENT_FAILURE: ${message}`);
    process.exit(2);
  }

  console.error(error);
  process.exit(1);
}
