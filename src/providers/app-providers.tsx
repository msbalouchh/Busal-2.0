"use client";

import type { ReactNode } from "react";

import { ErrorBoundary } from "@/components/common/error-boundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthSessionProvider } from "@/modules/auth/providers/auth-session-provider";
import { NotificationProvider } from "@/providers/notification-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryProvider>
        <AuthSessionProvider>
          <TooltipProvider delayDuration={0}>
            <ErrorBoundary>
              {children}
              <NotificationProvider />
            </ErrorBoundary>
          </TooltipProvider>
        </AuthSessionProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
