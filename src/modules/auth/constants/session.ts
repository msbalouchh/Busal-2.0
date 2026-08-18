/** Client session refresh interval — keeps Supabase tokens fresh before expiry. */
export const AUTH_SESSION_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/** Minutes of inactivity before the session warning appears. */
export const IDLE_TIMEOUT_MINUTES = 15;

/** Seconds shown in the session-expiring countdown before automatic sign-out. */
export const WARNING_SECONDS = 60;

/** Derived idle timeout in milliseconds. */
export const AUTH_SESSION_IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;

/** Derived warning duration in milliseconds. */
export const AUTH_SESSION_WARNING_MS = WARNING_SECONDS * 1000;

/** Broadcast channel name for cross-tab session sync. */
export const AUTH_SESSION_SYNC_CHANNEL = "busal-auth-session-sync";

/** Custom event dispatched when session activity should reset idle timers. */
export const AUTH_SESSION_ACTIVITY_EVENT = "busal:session-activity";

/** DOM attribute marking the idle-session warning dialog (excluded from idle pause detection). */
export const AUTH_SESSION_WARNING_DIALOG_ATTR = "data-idle-session-warning";

/** Activity events that reset the idle timer. */
export const AUTH_SESSION_ACTIVITY_EVENTS = [
  "mousedown",
  "click",
  "keydown",
  "scroll",
  "touchstart",
  "touchmove",
  "mousemove",
] as const;

/** Throttle window for high-frequency events such as mousemove. */
export const AUTH_SESSION_ACTIVITY_THROTTLE_MS = 1_000;

/** Poll interval while a blocking modal pauses the idle timer. */
export const AUTH_SESSION_MODAL_PAUSE_POLL_MS = 10_000;
