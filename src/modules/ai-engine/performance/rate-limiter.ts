interface RateBucket {
  count: number;
  windowStart: number;
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 60;

/** Per-business in-process rate limiter. */
export class AiRateLimiter {
  private readonly buckets = new Map<string, RateBucket>();

  assertAllowed(key: string, maxRequests = DEFAULT_MAX_REQUESTS, windowMs = DEFAULT_WINDOW_MS): void {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || now - bucket.windowStart >= windowMs) {
      this.buckets.set(key, { count: 1, windowStart: now });
      return;
    }

    if (bucket.count >= maxRequests) {
      throw new Error("AI rate limit exceeded. Please try again shortly.");
    }

    bucket.count += 1;
  }
}

export const aiRateLimiter = new AiRateLimiter();

interface QueuedTask<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

/** Simple serial request queue to avoid provider burst overload. */
export class AiRequestQueue {
  private readonly queue: QueuedTask<unknown>[] = [];
  private running = false;
  private readonly concurrency: number;

  constructor(concurrency = 4) {
    this.concurrency = concurrency;
  }

  enqueue<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      void this.pump();
    });
  }

  private async pump(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.concurrency);
      await Promise.all(
        batch.map(async (task) => {
          try {
            const result = await task.execute();
            task.resolve(result);
          } catch (error) {
            task.reject(error instanceof Error ? error : new Error("Queued AI task failed"));
          }
        }),
      );
    }

    this.running = false;
  }
}

export const aiRequestQueue = new AiRequestQueue();
