import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { BusinessContextProvider } from "@/modules/business-context/components/business-context-provider";
import { resolveBusinessContextForUser } from "@/modules/business-context/services/business-context.service";
import { serializeClientBusinessContext } from "@/modules/business-context/services/business-context.service";
import { getWorkspaceAccessSnapshot } from "@/modules/auth/lib/workspace-access";
import { DashboardProvider } from "@/modules/dashboard/components/dashboard-provider";
import { resolveNavigationFeatureFlags } from "@/modules/dashboard/lib/resolve-navigation-feature-flags";
import { serializeClientDashboardContext } from "@/modules/dashboard/lib/serialize-dashboard-context";
import { resolveDisplayName } from "@/modules/dashboard/lib/dashboard-display";
import { WorkspaceShell } from "@/modules/application-shell";
import { DashboardPlatformProviders } from "@/modules/application-shell/components/dashboard-platform-providers";
import { getDashboardPlatformSnapshots } from "@/modules/application-shell/lib/get-dashboard-platform-snapshots";
import { getWorkspaceShellData } from "@/modules/application-shell/lib/get-workspace-shell-data";
import { getCurrentUser } from "@/services/auth.service";

export const dynamic = "force-dynamic";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`${ROUTES.login}?redirectTo=${encodeURIComponent(ROUTES.dashboard)}`);
  }

  const workspace = await getWorkspaceAccessSnapshot(user.id);

  if (workspace.state === "no_workspace" || workspace.state === "provisioning_incomplete") {
    redirect(ROUTES.businessOnboarding);
  }

  const context = await resolveBusinessContextForUser(user);
  const ownerName = resolveDisplayName(context.business.ownerName, context.user.fullName);
  const clientContext = serializeClientBusinessContext(context);

  const [clientDashboard, shellData, platformSnapshots] = await Promise.all([
    resolveNavigationFeatureFlags(context).then((featureFlags) =>
      serializeClientDashboardContext(context, featureFlags),
    ),
    getWorkspaceShellData(context),
    getDashboardPlatformSnapshots(context),
  ]);

  return (
    <BusinessContextProvider initialContext={clientContext}>
      <DashboardProvider value={clientDashboard}>
        <DashboardPlatformProviders
          tenantSnapshot={platformSnapshots.tenant}
          rbacSnapshot={platformSnapshots.rbac}
        >
          <WorkspaceShell
            workspaceName={shellData.workspaceName}
            businessName={shellData.businessName}
            branchName={shellData.branchName}
            workspaces={shellData.workspaces}
            notifications={shellData.notifications}
            userName={ownerName}
            userEmail={context.user.email}
          >
            {children}
          </WorkspaceShell>
        </DashboardPlatformProviders>
      </DashboardProvider>
    </BusinessContextProvider>
  );
}
