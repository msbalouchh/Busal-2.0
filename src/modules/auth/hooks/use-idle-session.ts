"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  AUTH_SESSION_ACTIVITY_EVENT,
  AUTH_SESSION_ACTIVITY_EVENTS,
  AUTH_SESSION_ACTIVITY_THROTTLE_MS,
  AUTH_SESSION_IDLE_TIMEOUT_MS,
  AUTH_SESSION_MODAL_PAUSE_POLL_MS,
  AUTH_SESSION_SYNC_CHANNEL,
  AUTH_SESSION_WARNING_DIALOG_ATTR,
  AUTH_SESSION_WARNING_MS,
  WARNING_SECONDS,
} from "@/modules/auth/constants/session";

type SessionSyncMessage =
  | { type: "activity"; timestamp: number }
  | { type: "continue"; timestamp: number }
  | { type: "logout" };

function hasBlockingModalOpen(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const openDialogs = document.querySelectorAll('[role="dialog"][data-state="open"]');

  for (const dialog of openDialogs) {
    if (!dialog.hasAttribute(AUTH_SESSION_WARNING_DIALOG_ATTR)) {
      return true;
    }
  }

  return false;
}

interface UseIdleSessionOptions {
  enabled: boolean;
  onIdleLogout: () => Promise<void>;
  onManualLogout: () => Promise<void>;
  onRemoteLogout: () => Promise<void>;
}

interface UseIdleSessionResult {
  warningOpen: boolean;
  secondsRemaining: number;
  isSigningOut: boolean;
  continueWorking: () => void;
  signOutNow: () => void;
  markActivity: (options?: { force?: boolean }) => void;
}

export function useIdleSession({
  enabled,
  onIdleLogout,
  onManualLogout,
  onRemoteLogout,
}: UseIdleSessionOptions): UseIdleSessionResult {
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(WARNING_SECONDS);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const lastActivityRef = useRef(Date.now());
  const lastThrottleRef = useRef(0);
  const idleTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const onIdleLogoutRef = useRef(onIdleLogout);
  const onManualLogoutRef = useRef(onManualLogout);
  const onRemoteLogoutRef = useRef(onRemoteLogout);

  useEffect(() => {
    onIdleLogoutRef.current = onIdleLogout;
    onManualLogoutRef.current = onManualLogout;
    onRemoteLogoutRef.current = onRemoteLogout;
  }, [onIdleLogout, onManualLogout, onRemoteLogout]);

  const clearIdleTimeout = useCallback(() => {
    if (idleTimeoutRef.current !== null) {
      window.clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  }, []);

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const openWarning = useCallback(() => {
    if (!enabled) {
      return;
    }

    if (hasBlockingModalOpen()) {
      idleTimeoutRef.current = window.setTimeout(() => {
        openWarning();
      }, AUTH_SESSION_MODAL_PAUSE_POLL_MS);
      return;
    }

    setWarningOpen(true);
    setSecondsRemaining(WARNING_SECONDS);
    clearCountdown();

    countdownIntervalRef.current = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          clearCountdown();
          void onIdleLogoutRef.current();
          return 0;
        }

        return current - 1;
      });
    }, 1_000);
  }, [clearCountdown, enabled]);

  const scheduleIdleWarning = useCallback(() => {
    clearIdleTimeout();

    if (!enabled || warningOpen) {
      return;
    }

    if (hasBlockingModalOpen()) {
      idleTimeoutRef.current = window.setTimeout(() => {
        scheduleIdleWarning();
      }, AUTH_SESSION_MODAL_PAUSE_POLL_MS);
      return;
    }

    const elapsed = Date.now() - lastActivityRef.current;
    const remaining = AUTH_SESSION_IDLE_TIMEOUT_MS - elapsed;

    if (remaining <= 0) {
      openWarning();
      return;
    }

    idleTimeoutRef.current = window.setTimeout(() => {
      openWarning();
    }, remaining);
  }, [clearIdleTimeout, enabled, openWarning, warningOpen]);

  const markActivity = useCallback(
    (options?: { broadcast?: boolean; force?: boolean }) => {
      if (!enabled) {
        return;
      }

      const now = Date.now();

      if (!options?.force && now - lastThrottleRef.current < AUTH_SESSION_ACTIVITY_THROTTLE_MS) {
        return;
      }

      lastThrottleRef.current = now;
      lastActivityRef.current = now;

      if (options?.broadcast !== false) {
        channelRef.current?.postMessage({
          type: "activity",
          timestamp: now,
        } satisfies SessionSyncMessage);
      }

      if (!warningOpen) {
        scheduleIdleWarning();
      }
    },
    [enabled, scheduleIdleWarning, warningOpen],
  );

  const continueWorking = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    lastThrottleRef.current = now;
    setWarningOpen(false);
    clearCountdown();
    channelRef.current?.postMessage({
      type: "continue",
      timestamp: now,
    } satisfies SessionSyncMessage);
    scheduleIdleWarning();
  }, [clearCountdown, scheduleIdleWarning]);

  const signOutNow = useCallback(async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setWarningOpen(false);
    clearCountdown();
    channelRef.current?.postMessage({ type: "logout" } satisfies SessionSyncMessage);

    try {
      await onManualLogoutRef.current();
    } finally {
      setIsSigningOut(false);
    }
  }, [clearCountdown, isSigningOut]);

  useEffect(() => {
    if (!enabled) {
      clearIdleTimeout();
      clearCountdown();
      setWarningOpen(false);
      return;
    }

    scheduleIdleWarning();

    return () => {
      clearIdleTimeout();
      clearCountdown();
    };
  }, [clearCountdown, clearIdleTimeout, enabled, scheduleIdleWarning]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleActivity = () => {
      markActivity();
    };

    const handleCustomActivity = () => {
      markActivity({ force: true });
    };

    for (const eventName of AUTH_SESSION_ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }

    window.addEventListener(AUTH_SESSION_ACTIVITY_EVENT, handleCustomActivity);

    return () => {
      for (const eventName of AUTH_SESSION_ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleActivity);
      }

      window.removeEventListener(AUTH_SESSION_ACTIVITY_EVENT, handleCustomActivity);
    };
  }, [enabled, markActivity]);

  useEffect(() => {
    if (!enabled || typeof BroadcastChannel === "undefined") {
      return;
    }

    const channel = new BroadcastChannel(AUTH_SESSION_SYNC_CHANNEL);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<SessionSyncMessage>) => {
      const message = event.data;

      if (message.type === "activity" || message.type === "continue") {
        lastActivityRef.current = message.timestamp;
        lastThrottleRef.current = message.timestamp;
        setWarningOpen(false);
        clearCountdown();
        scheduleIdleWarning();
        return;
      }

      if (message.type === "logout") {
        void onRemoteLogoutRef.current();
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [clearCountdown, enabled, scheduleIdleWarning]);

  useEffect(() => {
    if (!enabled || typeof window.fetch !== "function") {
      return;
    }

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.ok) {
        window.dispatchEvent(new Event(AUTH_SESSION_ACTIVITY_EVENT));
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [enabled]);

  return {
    warningOpen,
    secondsRemaining,
    isSigningOut,
    continueWorking,
    signOutNow,
    markActivity,
  };
}

export function dispatchAuthSessionActivity(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_ACTIVITY_EVENT));
}
