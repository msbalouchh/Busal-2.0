import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BusinessContextProvider } from "@/modules/business-context/components/business-context-provider";
import { serializeClientBusinessContext } from "@/modules/business-context/services/business-context.service";
import { getDashboardContext } from "@/modules/dashboard/lib/get-dashboard-context";
import {
  getTimeOfDayGreeting,
  resolveDisplayName,
} from "@/modules/dashboard/lib/dashboard-display";

export const dynamic = "force-dynamic";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const context = await getDashboardContext();

  const ownerName = resolveDisplayName(context.business.ownerName, context.user.fullName);
  const greeting = getTimeOfDayGreeting();
  const clientContext = serializeClientBusinessContext(context);

  return (
    <BusinessContextProvider initialContext={clientContext}>
      <DashboardShell greeting={`${greeting}, ${ownerName}`} userEmail={context.user.email}>
        {children}
      </DashboardShell>
    </BusinessContextProvider>
  );
}
