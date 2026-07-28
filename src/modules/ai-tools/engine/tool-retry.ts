import { DEFAULT_RETRY_POLICY } from "@/modules/ai-tools/constants/routes";
import type { RetryPolicy } from "@/modules/ai-tools/types/tool-types";

export function resolveRetryPolicy(partial?: Partial<RetryPolicy>): RetryPolicy {
  return {
    maxRetries: partial?.maxRetries ?? DEFAULT_RETRY_POLICY.maxRetries,
    timeoutMs: partial?.timeoutMs ?? DEFAULT_RETRY_POLICY.timeoutMs,
    backoffMs: partial?.backoffMs ?? DEFAULT_RETRY_POLICY.backoffMs,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Tool execution timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  policy: RetryPolicy,
): Promise<{ result: T; retryCount: number }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= policy.maxRetries; attempt += 1) {
    try {
      const result = await withTimeout(operation(), policy.timeoutMs);
      return { result, retryCount: attempt };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < policy.maxRetries) {
        await delay(policy.backoffMs * (attempt + 1));
      }
    }
  }

  throw lastError ?? new Error("Tool execution failed");
}
