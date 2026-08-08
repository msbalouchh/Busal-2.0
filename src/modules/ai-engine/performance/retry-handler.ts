const DEFAULT_MAX_FAILURES = 3;
const DEFAULT_COOLDOWN_MS = 30_000;

/** Simple circuit breaker per provider. */
export class AiCircuitBreaker {
  private failures = 0;
  private openedAt: number | null = null;

  constructor(private readonly providerId: string) {}

  canExecute(): boolean {
    if (this.openedAt === null) {
      return true;
    }

    if (Date.now() - this.openedAt >= DEFAULT_COOLDOWN_MS) {
      this.openedAt = null;
      this.failures = 0;
      return true;
    }

    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.openedAt = null;
  }

  recordFailure(): void {
    this.failures += 1;
    if (this.failures >= DEFAULT_MAX_FAILURES) {
      this.openedAt = Date.now();
    }
  }

  getState(): { providerId: string; failures: number; open: boolean } {
    return {
      providerId: this.providerId,
      failures: this.failures,
      open: this.openedAt !== null,
    };
  }
}

export async function executeWithAiRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("AI operation failed");
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * attempt));
      }
    }
  }

  throw lastError ?? new Error("AI operation failed after retries");
}
