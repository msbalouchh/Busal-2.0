"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, type ReactNode } from "react";

import { QUERY_KEYS, STALE_TIMES } from "@/constants/query";
import { API_ROUTES, ROUTES } from "@/constants/routes";
import { SessionExpiringDialog } from "@/modules/auth/components/session-expiring-dialog";
import { AUTH_SESSION_REFRESH_INTERVAL_MS } from "@/modules/auth/constants/session";
import { useIdleSession } from "@/modules/auth/hooks/use-idle-session";
import { fetchSession } from "@/modules/auth/lib/auth.client";
import { performClientLogout } from "@/modules/auth/lib/client-logout";
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

/** Keeps client auth state aligned with Supabase cookies, refresh, and idle expiry. */
export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  const sessionMonitoringEnabled = isProtectedPath(pathname);

  const logout = useCallback(
    async (options?: { broadcast?: boolean }) => {
      await performClientLogout({
        queryClient,
        redirectPath: sessionMonitoringEnabled ? pathname : null,
        broadcast: options?.broadcast ?? true,
      });
    },
    [pathname, queryClient, sessionMonitoringEnabled],
  );

  const {
    warningOpen,
    secondsRemaining,
    isSigningOut,
    continueWorking,
    signOutNow,
    markActivity,
  } = useIdleSession({
    enabled: sessionMonitoringEnabled,
    onIdleLogout: () => logout(),
    onManualLogout: () => logout(),
    onRemoteLogout: () => logout({ broadcast: false }),
  });

  useEffect(() => {
    if (!sessionMonitoringEnabled) {
      return;
    }

    markActivity({ force: true });
  }, [markActivity, pathname, sessionMonitoringEnabled]);

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

    if (!sessionUser && sessionMonitoringEnabled) {
      const redirectTo = encodeURIComponent(pathname);
      router.replace(`${ROUTES.login}?redirectTo=${redirectTo}`);
    }
  }, [isLoading, pathname, router, sessionMonitoringEnabled, sessionUser, setUser]);

  useEffect(() => {
    if (!sessionMonitoringEnabled || !sessionUser || warningOpen) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      const refreshed = await refreshSessionOnServer();

      if (!refreshed) {
        await logout({ broadcast: false });
        return;
      }

      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session });
    }, AUTH_SESSION_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [logout, queryClient, sessionMonitoringEnabled, sessionUser, warningOpen]);

  return (
    <>
      {children}
      <SessionExpiringDialog
        open={warningOpen}
        secondsRemaining={secondsRemaining}
        isSigningOut={isSigningOut}
        onContinueWorking={continueWorking}
        onSignOut={() => {
          void signOutNow();
        }}
      />
    </>
  );
}
