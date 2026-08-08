import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type PrismaTransactionOptions = {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

/** Supabase pooler-friendly defaults (PgBouncer transaction mode). */
export const SUPABASE_TRANSACTION_OPTIONS: PrismaTransactionOptions = {
  maxWait: 15_000,
  timeout: 30_000,
};

export function isTransientPrismaError(error: unknown): boolean {
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

export async function withTransientRetry<T>(
  operation: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isTransientPrismaError(error) || attempt === maxAttempts) {
        throw error;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, baseDelayMs * attempt);
      });
    }
  }

  throw new Error("Transient database retry exhausted");
}

type InteractiveTransactionFn<T> = (tx: Prisma.TransactionClient) => Promise<T>;

export async function runInteractiveTransaction<T>(
  fn: InteractiveTransactionFn<T>,
  options: PrismaTransactionOptions = SUPABASE_TRANSACTION_OPTIONS,
): Promise<T> {
  return withTransientRetry(() => prisma.$transaction(fn, options));
}

export async function runBatchTransaction(
  operations: Array<Prisma.PrismaPromise<unknown>>,
  options: PrismaTransactionOptions = SUPABASE_TRANSACTION_OPTIONS,
): Promise<void> {
  await withTransientRetry(async () => {
    await prisma.$transaction(operations, options);
  });
}
