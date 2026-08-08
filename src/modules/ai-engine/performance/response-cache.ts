import { createHash } from "node:crypto";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000;

/** In-process response cache keyed by prompt hash. */
export class AiResponseCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  private buildKey(parts: string[]): string {
    return createHash("sha256").update(parts.join("|")).digest("hex");
  }

  get<T>(parts: string[]): T | null {
    const key = this.buildKey(parts);
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(parts: string[], value: T, ttlMs = DEFAULT_TTL_MS): void {
    const key = this.buildKey(parts);
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}

export const aiResponseCache = new AiResponseCache();
