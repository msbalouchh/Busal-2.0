"use client";

import type { ReactNode } from "react";

import { ErrorBoundary } from "@/components/common/error-boundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationProvider } from "@/providers/notification-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <TooltipProvider delayDuration={0}>
          <ErrorBoundary>
            {children}
            <NotificationProvider />
          </ErrorBoundary>
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
