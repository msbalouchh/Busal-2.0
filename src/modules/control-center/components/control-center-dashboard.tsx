"use client";

import dynamic from "next/dynamic";
import {
  Activity,
  AlertTriangle,
  Bot,
  Building2,
  HardDrive,
  LifeBuoy,
  Rocket,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";

import { PageContainer } from "@/components/common/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCard } from "@/modules/control-center/components/dashboard/alert-card";
import { ControlCenterQuickActionCard } from "@/modules/control-center/components/dashboard/quick-action-card";
import {
  DashboardGrid,
  DashboardGridItem,
} from "@/modules/control-center/components/dashboard/dashboard-grid";
import { HealthCard } from "@/modules/control-center/components/dashboard/health-card";
import { IncidentCard } from "@/modules/control-center/components/dashboard/incident-card";
import { PlatformStatCard } from "@/modules/control-center/components/dashboard/platform-stat-card";
import { RevenueCard } from "@/modules/control-center/components/dashboard/revenue-card";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import { TenantSummaryCard } from "@/modules/control-center/components/dashboard/tenant-summary-card";
import {
  formatRequestCount,
  formatStorageUsage,
  formatTokenUsage,
  UsageCard,
} from "@/modules/control-center/components/dashboard/usage-card";
import { WidgetContainer } from "@/modules/control-center/components/dashboard/widget-container";
import { useControlCenterContext } from "@/modules/control-center/components/control-center-provider";
import {
  CONTROL_CENTER_QUICK_ACTIONS,
  CONTROL_CENTER_WIDGETS,
} from "@/modules/control-center/constants/navigation";
import { filterControlCenterQuickActions } from "@/modules/control-center/lib/filter-control-center-navigation";
import { hasPermission } from "@/modules/authorization/utils/permission-utils";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import type { ControlCenterPlatformBundle } from "@/modules/control-center/types/control-center-types";

const LazyPlatformActivityFeed = dynamic(
  () =>
    import("@/modules/control-center/components/dashboard/platform-activity-feed").then(
      (module) => module.PlatformActivityFeed,
    ),
  {
    loading: () => (
      <WidgetContainer id="platform-activity" title="Platform Activity" loading>
        {null}
      </WidgetContainer>
    ),
  },
);

interface ControlCenterDashboardProps {
  bundle: ControlCenterPlatformBundle;
  operatorName: string;
}

function formatCurrency(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export function ControlCenterDashboard({ bundle, operatorName }: ControlCenterDashboardProps) {
  const { permissions, featureFlags } = useControlCenterContext();
  const { widgets, activity, tenantSummaries, incidents, alerts, deployments } = bundle;

  const quickActions = useMemo(
    () => filterControlCenterQuickActions(CONTROL_CENTER_QUICK_ACTIONS, permissions, featureFlags),
    [featureFlags, permissions],
  );

  const canViewTenants = hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_TENANTS);
  const canViewRevenue = hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_REVENUE);
  const canViewAi = hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_AI);
  const canViewMonitoring = hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_MONITORING);
  const canViewIncidents = hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_INCIDENTS);
  const canViewMarketplace = hasPermission(
    permissions,
    PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE,
  );
  const canViewSupport = hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SUPPORT);
  const canViewReleases = hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_RELEASES);

  return (
    <PageContainer className="gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {operatorName}</CardTitle>
          <CardDescription>
            Busal Control Center provides cross-tenant platform visibility and operator workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {CONTROL_CENTER_WIDGETS.length} live platform widgets across tenants, billing, AI,
            monitoring, and support operations.
          </p>
        </CardContent>
      </Card>

      <DashboardGrid>
        {canViewTenants ? (
          <DashboardGridItem>
            <PlatformStatCard
              title="Total Tenants"
              value={widgets.totalTenants}
              icon={Users}
              description="Registered tenant records"
            />
          </DashboardGridItem>
        ) : null}

        <DashboardGridItem>
          <PlatformStatCard
            title="Active Businesses"
            value={widgets.activeBusinesses}
            icon={Building2}
            description="Onboarding completed"
          />
        </DashboardGridItem>

        {canViewRevenue ? (
          <>
            <DashboardGridItem>
              <RevenueCard
                title="MRR"
                amountPence={widgets.mrrPence}
                description="Estimated monthly recurring revenue"
              />
            </DashboardGridItem>
            <DashboardGridItem>
              <RevenueCard
                title="ARR"
                amountPence={widgets.arrPence}
                description="Annualized recurring revenue"
              />
            </DashboardGridItem>
            <DashboardGridItem>
              <PlatformStatCard
                title="Platform Revenue"
                value={formatCurrency(widgets.platformRevenuePence)}
                icon={Wallet}
                description="Marketplace revenue"
              />
            </DashboardGridItem>
          </>
        ) : null}

        {canViewAi ? (
          <DashboardGridItem>
            <UsageCard
              title="AI Usage"
              value={formatTokenUsage(widgets.aiTokensUsed)}
              description="Total tokens consumed"
              icon={Bot}
            />
          </DashboardGridItem>
        ) : null}

        {canViewMonitoring ? (
          <>
            <DashboardGridItem>
              <UsageCard
                title="API Requests"
                value={formatRequestCount(widgets.apiRequests)}
                description="Performance log entries"
                icon={Activity}
              />
            </DashboardGridItem>
            <DashboardGridItem>
              <UsageCard
                title="Storage Usage"
                value={formatStorageUsage(widgets.storageUsageBytes)}
                description="Platform file storage"
                icon={HardDrive}
              />
            </DashboardGridItem>
            <DashboardGridItem>
              <HealthCard score={widgets.platformHealthScore} />
            </DashboardGridItem>
          </>
        ) : null}

        {canViewIncidents ? (
          <DashboardGridItem>
            <PlatformStatCard
              title="Active Incidents"
              value={widgets.activeIncidents}
              icon={AlertTriangle}
              description="Open error events (30d window)"
            />
          </DashboardGridItem>
        ) : null}

        {canViewMarketplace ? (
          <DashboardGridItem>
            <PlatformStatCard
              title="Marketplace Activity"
              value={widgets.marketplaceInstalls}
              icon={ShoppingBag}
              description="Active installations"
            />
          </DashboardGridItem>
        ) : null}

        {canViewMonitoring ? (
          <DashboardGridItem>
            <PlatformStatCard
              title="System Alerts"
              value={widgets.systemAlerts}
              icon={AlertTriangle}
              description="Open monitoring alerts"
            />
          </DashboardGridItem>
        ) : null}

        {canViewTenants ? (
          <DashboardGridItem>
            <PlatformStatCard
              title="Recent Signups"
              value={widgets.recentSignups}
              icon={TrendingUp}
              description="New businesses (30 days)"
            />
          </DashboardGridItem>
        ) : null}

        {canViewSupport ? (
          <DashboardGridItem>
            <PlatformStatCard
              title="Support Queue"
              value={widgets.supportQueue}
              icon={LifeBuoy}
              description="Open communication threads"
            />
          </DashboardGridItem>
        ) : null}
      </DashboardGrid>

      <section className="space-y-4">
        <SectionHeader
          title="Quick Actions"
          description="Launch common operator workflows without leaving the dashboard."
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <ControlCenterQuickActionCard key={action.id} label={action.label} href={action.href} />
          ))}
        </div>
      </section>

      <DashboardGrid>
        <DashboardGridItem span={2}>
          <WidgetContainer id="platform-activity" title="Platform Activity">
            <LazyPlatformActivityFeed items={activity} />
          </WidgetContainer>
        </DashboardGridItem>

        <DashboardGridItem span={2}>
          <TenantSummaryCard tenants={tenantSummaries} />
        </DashboardGridItem>

        {canViewIncidents ? (
          <DashboardGridItem>
            <IncidentCard incidents={incidents} />
          </DashboardGridItem>
        ) : null}

        {canViewMonitoring ? (
          <DashboardGridItem>
            <AlertCard alerts={alerts} />
          </DashboardGridItem>
        ) : null}

        {canViewReleases ? (
          <DashboardGridItem span={2}>
            <WidgetContainer
              id="latest-deployments"
              title="Latest Deployments"
              description="Recent backup and release activity"
            >
              {deployments.length === 0 ? (
                <p className="text-muted-foreground text-sm">No deployment records yet.</p>
              ) : (
                <ul className="space-y-3" aria-label="Latest deployments">
                  {deployments.map((deployment) => (
                    <li
                      key={deployment.id}
                      className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{deployment.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {deployment.environment} · {deployment.status}
                        </p>
                      </div>
                      <Rocket
                        className="text-muted-foreground h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </WidgetContainer>
          </DashboardGridItem>
        ) : null}

        <DashboardGridItem span={2}>
          <WidgetContainer id="quick-actions" title="Operator Shortcuts">
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <ControlCenterQuickActionCard
                  key={action.id}
                  label={action.label}
                  href={action.href}
                />
              ))}
            </div>
          </WidgetContainer>
        </DashboardGridItem>
      </DashboardGrid>
    </PageContainer>
  );
}
