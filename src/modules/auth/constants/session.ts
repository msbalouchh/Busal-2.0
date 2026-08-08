/** Client session refresh interval — keeps Supabase tokens fresh before expiry. */
export const AUTH_SESSION_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/** Idle timeout before automatic sign-out (8 hours). */
export const AUTH_SESSION_IDLE_TIMEOUT_MS = 8 * 60 * 60 * 1000;

/** Activity events that reset the idle timer. */
export const AUTH_SESSION_ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
] as const;
