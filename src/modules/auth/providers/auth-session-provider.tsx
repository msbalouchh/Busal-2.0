"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

import { QUERY_KEYS, STALE_TIMES } from "@/constants/query";
import { API_ROUTES, ROUTES } from "@/constants/routes";
import { assignAppPath } from "@/lib/app-navigation";
import {
  AUTH_SESSION_ACTIVITY_EVENTS,
  AUTH_SESSION_IDLE_TIMEOUT_MS,
  AUTH_SESSION_REFRESH_INTERVAL_MS,
} from "@/modules/auth/constants/session";
import { fetchSession } from "@/modules/auth/lib/auth.client";
import { useAuthStore } from "@/stores/auth.store";

const PROTECTED_PREFIXES = ["/dashboard", "/app", "/control-center", "/onboarding"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

async function refreshSessionOnServer(): Promise<boolean> {
  const response = await fetch(API_ROUTES.session, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });

  return response.ok;
}

interface AuthSessionProviderProps {
  children: ReactNode;
}

/** Keeps client auth state aligned with Supabase cookies and handles refresh + idle expiry. */
export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const resetAuth = useAuthStore((state) => state.reset);
  const lastActivityRef = useRef(Date.now());

  const handleSessionExpired = useCallback(async () => {
    resetAuth();
    await queryClient.removeQueries({ queryKey: QUERY_KEYS.session });

    if (isProtectedPath(pathname)) {
      const redirectTo = encodeURIComponent(pathname);
      assignAppPath(`${ROUTES.login}?redirectTo=${redirectTo}`);
    }
  }, [pathname, queryClient, resetAuth]);

  const { data: sessionUser, isLoading } = useQuery({
    queryKey: QUERY_KEYS.session,
    queryFn: fetchSession,
    staleTime: STALE_TIMES.session,
    refetchOnWindowFocus: true,
    retry: false,
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setUser(sessionUser ?? null);

    if (!sessionUser && isProtectedPath(pathname)) {
      const redirectTo = encodeURIComponent(pathname);
      router.replace(`${ROUTES.login}?redirectTo=${redirectTo}`);
    }
  }, [isLoading, pathname, router, sessionUser, setUser]);

  useEffect(() => {
    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };

    for (const eventName of AUTH_SESSION_ACTIVITY_EVENTS) {
      window.addEventListener(eventName, markActivity, { passive: true });
    }

    return () => {
      for (const eventName of AUTH_SESSION_ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, markActivity);
      }
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      if (!isProtectedPath(pathname)) {
        return;
      }

      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= AUTH_SESSION_IDLE_TIMEOUT_MS) {
        try {
          await fetch(API_ROUTES.logout, { method: "POST", credentials: "include" });
        } catch {
          // Proceed with local cleanup even if logout request fails.
        }
        await handleSessionExpired();
        return;
      }

      const refreshed = await refreshSessionOnServer();
      if (!refreshed) {
        await handleSessionExpired();
        return;
      }

      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session });
    }, AUTH_SESSION_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [handleSessionExpired, pathname, queryClient]);

  return children;
}
