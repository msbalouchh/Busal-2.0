export const QUERY_KEYS = {
  session: ["session"] as const,
  user: ["user"] as const,
} as const;

export const STALE_TIMES = {
  session: 60_000,
  user: 300_000,
} as const;
