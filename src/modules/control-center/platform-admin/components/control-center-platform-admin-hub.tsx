"use client";

import { Loader2, Search } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { PlatformStatCard } from "@/modules/control-center/components/dashboard/platform-stat-card";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import { TenantConfirmDialog } from "@/modules/control-center/tenants/components/tenant-confirm-dialog";
import {
  clearControlCenterMaintenanceAction,
  createControlCenterFeatureFlagAction,
  createControlCenterReleaseAction,
  emergencyControlCenterMaintenanceAction,
  refreshControlCenterPlatformAdminBundleAction,
  rollbackControlCenterReleaseAction,
  scheduleControlCenterMaintenanceAction,
  updateControlCenterFeatureFlagAction,
  updateControlCenterPlatformSettingAction,
} from "@/modules/control-center/platform-admin/actions/control-center-platform-admin-actions";
import { PlatformAdminStatusBadge } from "@/modules/control-center/platform-admin/components/platform-admin-status-badge";
import type {
  ControlCenterFeatureFlagItem,
  ControlCenterPlatformAdminManagementBundle,
  ControlCenterPlatformSettingItem,
  ControlCenterReleaseItem,
  PlatformAdminView,
} from "@/modules/control-center/platform-admin/types/control-center-platform-admin-types";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

function formatMoney(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

function TrendBars({
  data,
  valueKey,
}: {
  data: Array<Record<string, string | number>>;
  valueKey: string;
}) {
  const values = data.map((entry) => Number(entry[valueKey] ?? 0));
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-24 items-end gap-2">
      {data.map((entry, index) => {
        const value = Number(entry[valueKey] ?? 0);
        const height = Math.max((value / max) * 100, 4);
        const label = String(entry.day ?? index);

        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div className="bg-primary/80 w-full rounded-t" style={{ height: `${height}%` }} />
            <span className="text-muted-foreground text-[10px]">{label.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

interface ControlCenterPlatformAdminHubProps {
  bundle: ControlCenterPlatformAdminManagementBundle;
  defaultView?: PlatformAdminView;
}

export function ControlCenterPlatformAdminHub({
  bundle: initialBundle,
  defaultView = "overview",
}: ControlCenterPlatformAdminHubProps) {
  const [isPending, startTransition] = useTransition();
  const [bundle, setBundle] = useState(initialBundle);
  const [search, setSearch] = useState("");
  const [selectedFlag, setSelectedFlag] = useState<ControlCenterFeatureFlagItem | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<ControlCenterReleaseItem | null>(null);
  const [selectedSetting, setSelectedSetting] = useState<ControlCenterPlatformSettingItem | null>(
    null,
  );
  const [settingValue, setSettingValue] = useState("");
  const [confirmRollback, setConfirmRollback] = useState<string | null>(null);
  const [confirmEmergency, setConfirmEmergency] = useState(false);
  const [newFlagKey, setNewFlagKey] = useState("");
  const [newFlagName, setNewFlagName] = useState("");
  const [newReleaseVersion, setNewReleaseVersion] = useState("");
  const [newReleaseNotes, setNewReleaseNotes] = useState("");

  const {
    widgets,
    permissions,
    settings,
    featureFlags,
    releases,
    environments,
    modules,
    maintenanceWindows,
    staff,
    audit,
    analytics,
    refreshedAt,
  } = bundle;

  const refreshAll = () => {
    startTransition(async () => {
      try {
        const next = await refreshControlCenterPlatformAdminBundleAction();
        setBundle(next);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to refresh platform data");
      }
    });
  };

  const saveSetting = () => {
    if (!selectedSetting) return;

    startTransition(async () => {
      try {
        let value: unknown = settingValue;
        if (selectedSetting.valueType === "BOOLEAN") {
          value = settingValue === "true";
        } else if (selectedSetting.valueType === "NUMBER") {
          value = Number(settingValue);
        }

        await updateControlCenterPlatformSettingAction({
          key: selectedSetting.key,
          value,
        });
        toast.success("Setting updated");
        setSelectedSetting(null);
        refreshAll();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update setting");
      }
    });
  };

  const createFlag = () => {
    startTransition(async () => {
      try {
        await createControlCenterFeatureFlagAction({
          key: newFlagKey,
          name: newFlagName,
          module: "platform",
          flagType: "BOOLEAN",
        });
        toast.success("Feature flag created");
        setNewFlagKey("");
        setNewFlagName("");
        refreshAll();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to create feature flag");
      }
    });
  };

  const toggleFlag = (flag: ControlCenterFeatureFlagItem) => {
    startTransition(async () => {
      try {
        await updateControlCenterFeatureFlagAction(flag.id, {
          status: flag.status === "ACTIVE" ? "DRAFT" : "ACTIVE",
          changeReason: "Toggled from Control Center",
        });
        toast.success("Feature flag updated");
        refreshAll();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update feature flag");
      }
    });
  };

  const createRelease = () => {
    startTransition(async () => {
      try {
        await createControlCenterReleaseAction({
          version: newReleaseVersion,
          releaseNotes: newReleaseNotes,
          environment: "production",
        });
        toast.success("Release created");
        setNewReleaseVersion("");
        setNewReleaseNotes("");
        refreshAll();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to create release");
      }
    });
  };

  const runRollback = () => {
    if (!confirmRollback) return;

    startTransition(async () => {
      try {
        await rollbackControlCenterReleaseAction(confirmRollback);
        toast.success("Release rolled back");
        setConfirmRollback(null);
        refreshAll();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to rollback release");
      }
    });
  };

  const runEmergencyMaintenance = () => {
    startTransition(async () => {
      try {
        await emergencyControlCenterMaintenanceAction();
        toast.success("Emergency maintenance activated");
        setConfirmEmergency(false);
        refreshAll();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to activate maintenance");
      }
    });
  };

  const clearMaintenance = () => {
    startTransition(async () => {
      try {
        await clearControlCenterMaintenanceAction();
        toast.success("Maintenance cleared");
        refreshAll();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to clear maintenance");
      }
    });
  };

  const scheduleMaintenance = () => {
    startTransition(async () => {
      try {
        await scheduleControlCenterMaintenanceAction({
          mode: "SCHEDULED",
          scope: "platform",
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          message: "Scheduled platform maintenance",
        });
        toast.success("Maintenance scheduled");
        refreshAll();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to schedule maintenance");
      }
    });
  };

  const showOverview = defaultView === "overview";
  const showSettings = defaultView === "overview" || defaultView === "settings";
  const showFeatureFlags = defaultView === "overview" || defaultView === "feature-flags";
  const showReleases =
    defaultView === "overview" || defaultView === "releases" || defaultView === "environments";
  const showMaintenance =
    defaultView === "overview" || defaultView === "maintenance" || defaultView === "administration";
  const showStaff = defaultView === "overview" || defaultView === "staff";
  const showAudit = defaultView === "overview" || defaultView === "audit";
  const showAnalytics = defaultView === "overview" || defaultView === "analytics";

  const titles: Record<PlatformAdminView, string> = {
    overview: "Platform Administration",
    settings: "Global Platform Settings",
    "feature-flags": "Feature Flag Management",
    releases: "Release Management",
    environments: "Environment Management",
    maintenance: "System Maintenance",
    administration: "Platform Administration",
    staff: "Platform Staff",
    audit: "Global Audit",
    analytics: "Platform Analytics",
  };

  return (
    <PageContainer className="gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeader
          title={titles[defaultView]}
          description="Global settings, releases, feature flags, maintenance, staff, audit, and platform analytics."
        />
        <Button variant="outline" onClick={refreshAll} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh
        </Button>
      </div>

      <p className="text-muted-foreground text-xs">Last updated {formatDate(refreshedAt)}</p>

      {showOverview ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <PlatformStatCard title="Active Feature Flags" value={widgets.activeFeatureFlags} />
          <PlatformStatCard title="Scheduled Releases" value={widgets.scheduledReleases} />
          <PlatformStatCard title="Active Tenants" value={widgets.activeTenants} />
          <PlatformStatCard title="Active Users" value={widgets.activeUsers} />
          <PlatformStatCard title="System Health" value={`${widgets.systemHealthPct}%`} />
          <PlatformStatCard
            title="Platform Revenue"
            value={formatMoney(widgets.platformRevenuePence)}
          />
          <PlatformStatCard title="AI Usage" value={widgets.aiTokensUsed.toLocaleString()} />
          <PlatformStatCard title="API Usage" value={widgets.apiRequests.toLocaleString()} />
          <PlatformStatCard title="Marketplace Installs" value={widgets.marketplaceInstalls} />
          <PlatformStatCard
            title="Maintenance Mode"
            value={widgets.platformMaintenanceMode.replace(/_/g, " ")}
          />
        </div>
      ) : null}

      {showSettings && permissions.canViewSettings ? (
        <section className="space-y-4">
          <SectionHeader title="Global Platform Settings" />
          {settings.length === 0 ? (
            <ControlCenterEmptyState
              title="No settings"
              description="Platform settings unavailable."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Setting</th>
                    <th className="px-4 py-3 text-left font-medium">Category</th>
                    <th className="px-4 py-3 text-left font-medium">Value</th>
                    <th className="px-4 py-3 text-left font-medium">Updated</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.map((setting) => (
                    <tr key={setting.key} className="border-t">
                      <td className="px-4 py-3">{setting.key}</td>
                      <td className="px-4 py-3 capitalize">{setting.category}</td>
                      <td className="px-4 py-3 font-mono text-xs">{String(setting.value)}</td>
                      <td className="text-muted-foreground px-4 py-3">
                        {formatDate(setting.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {permissions.canManageSettings ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSetting(setting);
                              setSettingValue(String(setting.value ?? ""));
                            }}
                          >
                            Edit
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {showFeatureFlags && permissions.canViewFeatureFlags ? (
        <section className="space-y-4">
          <SectionHeader title="Feature Flag Management" />
          {permissions.canManageFeatureFlags ? (
            <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
              <Input
                placeholder="Flag key"
                value={newFlagKey}
                onChange={(e) => setNewFlagKey(e.target.value)}
              />
              <Input
                placeholder="Flag name"
                value={newFlagName}
                onChange={(e) => setNewFlagName(e.target.value)}
              />
              <Button onClick={createFlag} disabled={!newFlagKey || !newFlagName || isPending}>
                Create Feature Flag
              </Button>
            </div>
          ) : null}
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Key</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Rollout</th>
                  <th className="px-4 py-3 text-left font-medium">Targets</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {featureFlags.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8">
                      <ControlCenterEmptyState
                        title="No feature flags"
                        description="Create a flag to begin rollout."
                      />
                    </td>
                  </tr>
                ) : (
                  featureFlags.items.map((flag) => (
                    <tr key={flag.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-medium">{flag.name}</div>
                        <div className="text-muted-foreground text-xs">{flag.key}</div>
                      </td>
                      <td className="px-4 py-3">
                        <PlatformAdminStatusBadge status={flag.status} />
                      </td>
                      <td className="px-4 py-3">{flag.rolloutPercentage}%</td>
                      <td className="px-4 py-3">{flag.targetCount}</td>
                      <td className="space-x-2 px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedFlag(flag)}>
                          Details
                        </Button>
                        {permissions.canManageFeatureFlags ? (
                          <Button variant="ghost" size="sm" onClick={() => toggleFlag(flag)}>
                            {flag.status === "ACTIVE" ? "Disable" : "Enable"}
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {showReleases && permissions.canViewReleases ? (
        <section className="space-y-4">
          <SectionHeader title="Release Management" />
          {permissions.canManageReleases ? (
            <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
              <Input
                placeholder="Version"
                value={newReleaseVersion}
                onChange={(e) => setNewReleaseVersion(e.target.value)}
              />
              <Input
                placeholder="Release notes"
                value={newReleaseNotes}
                onChange={(e) => setNewReleaseNotes(e.target.value)}
              />
              <Button
                onClick={createRelease}
                disabled={!newReleaseVersion || !newReleaseNotes || isPending}
              >
                Create Release
              </Button>
            </div>
          ) : null}
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Version</th>
                  <th className="px-4 py-3 text-left font-medium">Environment</th>
                  <th className="px-4 py-3 text-left font-medium">Rollout</th>
                  <th className="px-4 py-3 text-left font-medium">Deployed</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {releases.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8">
                      <ControlCenterEmptyState
                        title="No releases"
                        description="Create a release to track deployments."
                      />
                    </td>
                  </tr>
                ) : (
                  releases.items.map((release) => (
                    <tr key={release.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{release.version}</td>
                      <td className="px-4 py-3 capitalize">{release.environment}</td>
                      <td className="px-4 py-3">
                        <PlatformAdminStatusBadge status={release.rolloutStatus} />
                      </td>
                      <td className="text-muted-foreground px-4 py-3">
                        {formatDate(release.deployedAt)}
                      </td>
                      <td className="space-x-2 px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRelease(release)}
                        >
                          Details
                        </Button>
                        {permissions.canManageReleases ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmRollback(release.id)}
                          >
                            Rollback
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <SectionHeader title="Environment Management" />
          <div className="grid gap-4 md:grid-cols-3">
            {environments.map((environment) => (
              <Card key={environment.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    {environment.label}
                    <PlatformAdminStatusBadge status={environment.status} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Version: {environment.version}</p>
                  <p>Health: {environment.healthScore}%</p>
                  <p>Deployments: {environment.deploymentCount}</p>
                  <p className="text-muted-foreground">
                    Last deployment: {formatDate(environment.lastDeploymentAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {showMaintenance && permissions.canViewMaintenance ? (
        <section className="space-y-4">
          <SectionHeader title="System Maintenance" />
          <div className="flex flex-wrap gap-2">
            {permissions.canManageMaintenance ? (
              <>
                <Button variant="outline" onClick={scheduleMaintenance} disabled={isPending}>
                  Schedule Maintenance
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmEmergency(true)}
                  disabled={isPending}
                >
                  Emergency Maintenance
                </Button>
                <Button variant="secondary" onClick={clearMaintenance} disabled={isPending}>
                  Clear Maintenance
                </Button>
              </>
            ) : null}
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Scope</th>
                  <th className="px-4 py-3 text-left font-medium">Mode</th>
                  <th className="px-4 py-3 text-left font-medium">Target</th>
                  <th className="px-4 py-3 text-left font-medium">Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceWindows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8">
                      <ControlCenterEmptyState
                        title="No maintenance windows"
                        description="Platform is fully operational."
                      />
                    </td>
                  </tr>
                ) : (
                  maintenanceWindows.map((window) => (
                    <tr key={window.id} className="border-t">
                      <td className="px-4 py-3 capitalize">{window.scope}</td>
                      <td className="px-4 py-3">
                        <PlatformAdminStatusBadge status={window.mode} />
                      </td>
                      <td className="px-4 py-3">{window.businessName ?? "Platform-wide"}</td>
                      <td className="text-muted-foreground px-4 py-3">
                        {formatDate(window.scheduledAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <SectionHeader title="Platform Modules & Services" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => (
              <Card key={module.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    {module.name}
                    <PlatformAdminStatusBadge status={module.enabled ? "ACTIVE" : "INACTIVE"} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-xs">
                  {module.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {showStaff && permissions.canViewStaff ? (
        <section className="space-y-4">
          <SectionHeader title="Platform Staff" />
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Team</th>
                  <th className="px-4 py-3 text-left font-medium">MFA</th>
                  <th className="px-4 py-3 text-left font-medium">Sessions</th>
                  <th className="px-4 py-3 text-left font-medium">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8">
                      <ControlCenterEmptyState
                        title="No staff"
                        description="No platform staff records found."
                      />
                    </td>
                  </tr>
                ) : (
                  staff.map((member) => (
                    <tr key={member.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-medium">{member.fullName}</div>
                        <div className="text-muted-foreground text-xs">{member.email}</div>
                      </td>
                      <td className="px-4 py-3">{member.role}</td>
                      <td className="px-4 py-3">{member.team}</td>
                      <td className="px-4 py-3">{member.mfaEnabled ? "Enabled" : "Disabled"}</td>
                      <td className="px-4 py-3">{member.activeSessions}</td>
                      <td className="text-muted-foreground px-4 py-3">
                        {formatDate(member.lastSeenAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {showAudit && permissions.canViewAudit ? (
        <section className="space-y-4">
          <SectionHeader title="Global Audit" />
          <div className="relative max-w-sm">
            <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
            <Input
              className="pl-9"
              placeholder="Search audit events"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            {audit.items
              .filter((entry) => {
                if (!search.trim()) return true;
                const term = search.trim().toLowerCase();
                return (
                  entry.summary.toLowerCase().includes(term) ||
                  entry.eventType.toLowerCase().includes(term) ||
                  (entry.actorEmail?.toLowerCase().includes(term) ?? false)
                );
              })
              .map((entry) => (
                <div key={entry.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">{entry.summary}</div>
                    <PlatformAdminStatusBadge status={entry.category} label={entry.category} />
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {entry.actorEmail ?? "System"} · {formatDate(entry.createdAt)}
                  </p>
                </div>
              ))}
          </div>
        </section>
      ) : null}

      {showAnalytics && permissions.canViewAnalytics ? (
        <section className="space-y-4">
          <SectionHeader title="Platform Analytics" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Platform Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendBars data={analytics.tenantGrowth} valueKey="count" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendBars data={analytics.revenueTrend} valueKey="amountPence" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendBars data={analytics.aiUsageTrend} valueKey="tokens" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">API Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendBars data={analytics.apiUsageTrend} valueKey="requests" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Marketplace Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendBars data={analytics.marketplaceGrowth} valueKey="installs" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{analytics.slaPerformancePct}%</p>
                <p className="text-muted-foreground text-sm">SLA performance</p>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      <Drawer
        open={selectedSetting != null}
        onOpenChange={(open) => !open && setSelectedSetting(null)}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Setting</DrawerTitle>
            <DrawerDescription>{selectedSetting?.key}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 px-4">
            <Label htmlFor="setting-value">Value</Label>
            <Input
              id="setting-value"
              value={settingValue}
              onChange={(e) => setSettingValue(e.target.value)}
            />
          </div>
          <DrawerFooter>
            <Button onClick={saveSetting} disabled={isPending}>
              Save Setting
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={selectedFlag != null} onOpenChange={(open) => !open && setSelectedFlag(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{selectedFlag?.name}</DrawerTitle>
            <DrawerDescription>{selectedFlag?.key}</DrawerDescription>
          </DrawerHeader>
          {selectedFlag ? (
            <div className="space-y-2 px-4 text-sm">
              <p>Status: {selectedFlag.status}</p>
              <p>Rollout: {selectedFlag.rolloutPercentage}%</p>
              <p>Module: {selectedFlag.module}</p>
              <p>Targets: {selectedFlag.targetCount}</p>
              <p>Updated: {formatDate(selectedFlag.updatedAt)}</p>
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>

      <Drawer
        open={selectedRelease != null}
        onOpenChange={(open) => !open && setSelectedRelease(null)}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Release {selectedRelease?.version}</DrawerTitle>
            <DrawerDescription>{selectedRelease?.environment}</DrawerDescription>
          </DrawerHeader>
          {selectedRelease ? (
            <div className="space-y-2 px-4 text-sm">
              <PlatformAdminStatusBadge status={selectedRelease.rolloutStatus} />
              <p className="pt-2">{selectedRelease.releaseNotes}</p>
              <p className="text-muted-foreground">
                Deployed: {formatDate(selectedRelease.deployedAt)}
              </p>
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>

      <TenantConfirmDialog
        open={confirmRollback != null}
        onOpenChange={(open) => !open && setConfirmRollback(null)}
        title="Rollback release?"
        description="This marks the release as rolled back. Confirm to proceed."
        confirmLabel="Rollback"
        onConfirm={runRollback}
        loading={isPending}
      />

      <TenantConfirmDialog
        open={confirmEmergency}
        onOpenChange={setConfirmEmergency}
        title="Activate emergency maintenance?"
        description="This will enable full platform lock mode immediately."
        confirmLabel="Activate"
        onConfirm={runEmergencyMaintenance}
        loading={isPending}
      />
    </PageContainer>
  );
}
