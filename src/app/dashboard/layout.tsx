import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BusinessContextProvider } from "@/modules/business-context/components/business-context-provider";
import { serializeClientBusinessContext } from "@/modules/business-context/services/business-context.service";
import { DashboardProvider } from "@/modules/dashboard/components/dashboard-provider";
import { getDashboardShellContext } from "@/modules/dashboard/lib/get-dashboard-shell-context";
import {
  getTimeOfDayGreeting,
  resolveDisplayName,
} from "@/modules/dashboard/lib/dashboard-display";

export const dynamic = "force-dynamic";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { context, clientDashboard } = await getDashboardShellContext();

  const ownerName = resolveDisplayName(context.business.ownerName, context.user.fullName);
  const greeting = getTimeOfDayGreeting();
  const clientContext = serializeClientBusinessContext(context);

  return (
    <BusinessContextProvider initialContext={clientContext}>
      <DashboardProvider value={clientDashboard}>
        <DashboardShell greeting={`${greeting}, ${ownerName}`} userEmail={context.user.email}>
          {children}
        </DashboardShell>
      </DashboardProvider>
    </BusinessContextProvider>
  );
}
