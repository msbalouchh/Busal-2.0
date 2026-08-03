import type { ReactNode } from "react";

import { BusinessContextProvider } from "@/modules/business-context/components/business-context-provider";
import { serializeClientBusinessContext } from "@/modules/business-context/services/business-context.service";
import { DashboardProvider } from "@/modules/dashboard/components/dashboard-provider";
import { requireWorkspaceDashboardAccess } from "@/modules/auth/lib/require-workspace-dashboard-access";
import { getDashboardShellContext } from "@/modules/dashboard/lib/get-dashboard-shell-context";
import { resolveDisplayName } from "@/modules/dashboard/lib/dashboard-display";
import { WorkspaceShell } from "@/modules/application-shell";

export const dynamic = "force-dynamic";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  await requireWorkspaceDashboardAccess();
  const { context, clientDashboard } = await getDashboardShellContext();

  const ownerName = resolveDisplayName(context.business.ownerName, context.user.fullName);
  const clientContext = serializeClientBusinessContext(context);

  return (
    <BusinessContextProvider initialContext={clientContext}>
      <DashboardProvider value={clientDashboard}>
        <WorkspaceShell
          workspaceName={context.business.businessName ?? undefined}
          userName={ownerName}
          userEmail={context.user.email}
        >
          {children}
        </WorkspaceShell>
      </DashboardProvider>
    </BusinessContextProvider>
  );
}
