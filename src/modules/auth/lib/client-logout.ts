"use client";

import type { QueryClient } from "@tanstack/react-query";

import { API_ROUTES, ROUTES } from "@/constants/routes";
import { assignAppPath } from "@/lib/app-navigation";
import { AUTH_SESSION_SYNC_CHANNEL } from "@/modules/auth/constants/session";
import { useAuthStore } from "@/stores/auth.store";

export interface ClientLogoutOptions {
  queryClient?: QueryClient;
  redirectPath?: string | null;
  broadcast?: boolean;
}

function buildLoginUrl(redirectPath?: string | null): string {
  if (redirectPath && redirectPath !== ROUTES.login) {
    return `${ROUTES.login}?redirectTo=${encodeURIComponent(redirectPath)}`;
  }

  return ROUTES.login;
}

function broadcastLogout(): void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return;
  }

  try {
    const channel = new BroadcastChannel(AUTH_SESSION_SYNC_CHANNEL);
    channel.postMessage({ type: "logout" as const });
    channel.close();
  } catch {
    // Ignore broadcast failures in unsupported environments.
  }
}

/** Clears client auth state, server session, cookies, and cached queries. */
export async function performClientLogout(options: ClientLogoutOptions = {}): Promise<void> {
  const { queryClient, redirectPath = null, broadcast = true } = options;

  try {
    await fetch(API_ROUTES.logout, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    // Proceed with local cleanup even if the logout request fails.
  }

  useAuthStore.getState().reset();
  queryClient?.clear();

  if (broadcast) {
    broadcastLogout();
  }

  assignAppPath(buildLoginUrl(redirectPath));
}
