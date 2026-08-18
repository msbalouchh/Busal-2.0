"use client";

import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  activateControlCenterTenantAction,
  archiveControlCenterTenantAction,
  deleteControlCenterTenantAction,
  reactivateControlCenterTenantAction,
  refreshControlCenterTenantResourcesAction,
  setControlCenterTenantMaintenanceAction,
  suspendControlCenterTenantAction,
  updateControlCenterTenantResourceLimitsAction,
} from "@/modules/control-center/tenants/actions/control-center-tenant-actions";
import { TenantActivityTimeline } from "@/modules/control-center/tenants/components/tenant-activity-timeline";
import { TenantConfirmDialog } from "@/modules/control-center/tenants/components/tenant-confirm-dialog";
import {
  TenantStatusBadge,
  tenantHealthBadgeVariant,
  tenantLifecycleBadgeVariant,
} from "@/modules/control-center/tenants/components/tenant-status-badge";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import {
  CONTROL_CENTER_TENANT_ROUTES,
  TENANT_MAINTENANCE_MODES,
} from "@/modules/control-center/tenants/constants/control-center-tenants";
import type {
  ControlCenterTenantDetailBundle,
  ControlCenterTenantPermissions,
} from "@/modules/control-center/tenants/types/control-center-tenants-types";
import { TenantPlatformLists } from "@/modules/tenant-platform/components/tenant-platform-lists";
import { formatMaintenanceLabel } from "@/modules/tenant-platform/engine/maintenance-engine";

interface ControlCenterTenantDetailProps {
  bundle: ControlCenterTenantDetailBundle;
}

type ConfirmAction =
  "activate" | "suspend" | "reactivate" | "archive" | "delete" | "maintenance" | null;

export function ControlCenterTenantDetail({ bundle }: ControlCenterTenantDetailProps) {
  const { profile, permissions } = bundle;
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(profile.maintenanceMode);
  const [scheduledAt, setScheduledAt] = useState(profile.scheduledMaintenanceAt ?? "");

  const runLifecycle = (action: Exclude<ConfirmAction, "maintenance" | null>) => {
    startTransition(async () => {
      try {
        switch (action) {
          case "activate":
            await activateControlCenterTenantAction(profile.businessId);
            toast.success("Tenant activated");
            break;
          case "suspend":
            await suspendControlCenterTenantAction(profile.businessId);
            toast.success("Tenant suspended");
            break;
          case "reactivate":
            await reactivateControlCenterTenantAction(profile.businessId);
            toast.success("Tenant reactivated");
            break;
          case "archive":
            await archiveControlCenterTenantAction(profile.businessId);
            toast.success("Tenant archived");
            break;
          case "delete":
            await deleteControlCenterTenantAction(profile.businessId);
            toast.success("Tenant deleted");
            break;
        }
        setConfirmAction(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  const handleMaintenanceSave = () => {
    startTransition(async () => {
      try {
        await setControlCenterTenantMaintenanceAction(
          profile.businessId,
          maintenanceMode,
          maintenanceMode === "SCHEDULED" ? scheduledAt : null,
        );
        toast.success("Maintenance mode updated");
        setConfirmAction(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update maintenance mode");
      }
    });
  };

  const handleRefreshResources = () => {
    startTransition(async () => {
      try {
        await refreshControlCenterTenantResourcesAction(profile.businessId);
        toast.success("Tenant resources refreshed");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to refresh resources");
      }
    });
  };

  const handleResourceLimitsSave = () => {
    if (!profile.limits) {
      return;
    }

    startTransition(async () => {
      try {
        await updateControlCenterTenantResourceLimitsAction({
          businessId: profile.businessId,
          maxUsers: profile.limits?.maxUsers,
          maxBranches: profile.limits?.maxBranches,
          maxStorageBytes: Number(profile.limits?.maxStorageBytes ?? 0),
          maxApiCallsPerMonth: profile.limits?.maxApiCallsPerMonth,
          maxAiTokensPerMonth: profile.limits?.maxAiTokensPerMonth,
          maxDatabaseRows: profile.limits?.maxDatabaseRows,
          maxMarketplaceLicenses: profile.limits?.maxMarketplaceLicenses,
        });
        toast.success("Resource limits saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update resource limits");
      }
    });
  };

  return (
    <PageContainer>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={CONTROL_CENTER_TENANT_ROUTES.directory}>
            <ArrowLeft className="h-4 w-4" />
            Back to directory
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <TenantStatusBadge
            label={profile.tenant.lifecycleStatus}
            variant={tenantLifecycleBadgeVariant(profile.tenant.lifecycleStatus)}
          />
          <TenantStatusBadge
            label={profile.tenant.healthStatus}
            variant={tenantHealthBadgeVariant(profile.tenant.healthStatus)}
          />
          <TenantStatusBadge label={formatMaintenanceLabel(profile.maintenanceMode)} />
        </div>
      </div>

      <SectionHeader
        title={profile.businessName ?? "Tenant profile"}
        description="Cross-tenant visibility for business, lifecycle, resources, policies, and audit history."
        action={
          permissions.canManageResources ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshResources}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh resources
            </Button>
          ) : null
        }
      />

      <section className="grid gap-4 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-muted-foreground text-xs uppercase">Business ID</p>
          <p className="text-sm font-medium">{profile.businessId}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase">Tenant ID</p>
          <p className="text-sm font-medium">{profile.tenantId}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase">Owner</p>
          <p className="text-sm font-medium">{profile.owner.fullName ?? profile.owner.email}</p>
          <p className="text-muted-foreground text-xs">{profile.owner.email}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase">Subscription</p>
          <p className="text-sm font-medium">
            {profile.tenant.subscriptionPlan ?? "None"} · {profile.tenant.subscriptionStatus}
          </p>
        </div>
      </section>

      {profile.platform ? (
        <section className="grid gap-4 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-xs uppercase">Deployment mode</p>
            <p className="text-sm font-medium">{profile.platform.deploymentMode}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">White label</p>
            <p className="text-sm font-medium">
              {profile.platform.whiteLabelEnabled ? "Enabled" : "Disabled"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">Domain</p>
            <p className="text-sm font-medium">
              {profile.platform.customDomain ??
                (profile.platform.subdomain
                  ? `${profile.platform.subdomain}.getbusal.com`
                  : "getbusal.com (native)")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">API platform</p>
            <p className="text-sm font-medium">
              {profile.platform.apiEnabled
                ? `Enabled · ${profile.platform.apiKeyCount} keys`
                : "Disabled"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">Webhooks</p>
            <p className="text-sm font-medium">
              {profile.platform.webhooksEnabled
                ? `Enabled · ${profile.platform.webhookCount} subscriptions`
                : "Disabled"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">Platform status</p>
            <p className="text-sm font-medium">{profile.platform.platformStatus}</p>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-muted-foreground text-xs uppercase">Industry</p>
          <p className="text-sm font-medium">{profile.businessType ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase">Country / Timezone</p>
          <p className="text-sm font-medium">
            {profile.country ?? "—"} · {profile.timezone ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase">Branches / Users</p>
          <p className="text-sm font-medium">
            {profile.tenant.branchCount} / {profile.usage?.activeUsers ?? 0}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase">Active sessions</p>
          <p className="text-sm font-medium">{profile.activeSessions}</p>
        </div>
      </section>

      <LifecycleActions permissions={permissions} onAction={setConfirmAction} />

      <section className="space-y-4">
        <SectionHeader
          title="Branch overview"
          description="Branch status, usage, and manager coverage."
        />
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left">Branch</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Staff</th>
                <th className="px-4 py-2 text-left">Managers</th>
                <th className="px-4 py-2 text-left">Location</th>
              </tr>
            </thead>
            <tbody>
              {profile.branches.map((branch) => (
                <tr key={branch.id} className="border-t">
                  <td className="px-4 py-2">
                    {branch.name}
                    {branch.isMain ? " (Main)" : ""}
                  </td>
                  <td className="px-4 py-2">{branch.isActive ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-2">{branch.staffCount}</td>
                  <td className="px-4 py-2">{branch.managerCount}</td>
                  <td className="px-4 py-2">
                    {[branch.city, branch.country].filter(Boolean).join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {permissions.canMaintenance ? (
        <section className="space-y-4 rounded-lg border p-4">
          <SectionHeader
            title="Maintenance"
            description="Maintenance mode controls for this tenant."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maintenance-mode">Mode</Label>
              <select
                id="maintenance-mode"
                value={maintenanceMode}
                onChange={(event) =>
                  setMaintenanceMode(event.target.value as typeof maintenanceMode)
                }
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              >
                {TENANT_MAINTENANCE_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {formatMaintenanceLabel(mode)}
                  </option>
                ))}
              </select>
            </div>
            {maintenanceMode === "SCHEDULED" ? (
              <div className="space-y-2">
                <Label htmlFor="maintenance-schedule">Scheduled at</Label>
                <Input
                  id="maintenance-schedule"
                  type="datetime-local"
                  value={scheduledAt ? scheduledAt.slice(0, 16) : ""}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              </div>
            ) : null}
          </div>
          <Button onClick={() => setConfirmAction("maintenance")} disabled={isPending}>
            Save maintenance settings
          </Button>
        </section>
      ) : null}

      <TenantPlatformLists
        tenant={profile.tenant}
        settings={profile.settings ?? undefined}
        limits={profile.limits ?? undefined}
        usage={profile.usage ?? undefined}
        policies={profile.policies}
        health={profile.health ?? undefined}
        analytics={profile.analytics ?? undefined}
        activities={profile.activities}
        auditLogs={profile.auditLogs}
      />

      <section className="space-y-4">
        <SectionHeader title="Activity timeline" />
        <TenantActivityTimeline items={profile.activities} />
      </section>

      {permissions.canManageResources && profile.limits ? (
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleResourceLimitsSave} disabled={isPending}>
            Sync resource limits
          </Button>
        </div>
      ) : null}

      <TenantConfirmDialog
        open={confirmAction === "activate"}
        onOpenChange={() => setConfirmAction(null)}
        title="Activate tenant"
        description="This will activate the tenant and restore operational access."
        confirmLabel="Activate"
        loading={isPending}
        onConfirm={() => runLifecycle("activate")}
      />
      <TenantConfirmDialog
        open={confirmAction === "suspend"}
        onOpenChange={() => setConfirmAction(null)}
        title="Suspend tenant"
        description="Suspending a tenant restricts operational access until reactivated."
        confirmLabel="Suspend"
        destructive
        loading={isPending}
        onConfirm={() => runLifecycle("suspend")}
      />
      <TenantConfirmDialog
        open={confirmAction === "reactivate"}
        onOpenChange={() => setConfirmAction(null)}
        title="Reactivate tenant"
        description="Reactivate this tenant and restore access."
        confirmLabel="Reactivate"
        loading={isPending}
        onConfirm={() => runLifecycle("reactivate")}
      />
      <TenantConfirmDialog
        open={confirmAction === "archive"}
        onOpenChange={() => setConfirmAction(null)}
        title="Archive tenant"
        description="Archived tenants remain in the platform but are no longer operational."
        confirmLabel="Archive"
        destructive
        loading={isPending}
        onConfirm={() => runLifecycle("archive")}
      />
      <TenantConfirmDialog
        open={confirmAction === "delete"}
        onOpenChange={() => setConfirmAction(null)}
        title="Delete tenant"
        description="This marks the tenant as deleted. This action requires operator confirmation."
        confirmLabel="Delete"
        destructive
        loading={isPending}
        onConfirm={() => runLifecycle("delete")}
      />
      <TenantConfirmDialog
        open={confirmAction === "maintenance"}
        onOpenChange={() => setConfirmAction(null)}
        title="Update maintenance mode"
        description="Apply maintenance controls to this tenant."
        confirmLabel="Apply"
        loading={isPending}
        onConfirm={handleMaintenanceSave}
      />
    </PageContainer>
  );
}

function LifecycleActions({
  permissions,
  onAction,
}: {
  permissions: ControlCenterTenantPermissions;
  onAction: (action: ConfirmAction) => void;
}) {
  return (
    <section className="space-y-4">
      <SectionHeader
        title="Tenant lifecycle"
        description="Lifecycle transitions are audit logged."
      />
      <div className="flex flex-wrap gap-2">
        {permissions.canEdit ? (
          <Button variant="outline" size="sm" onClick={() => onAction("activate")}>
            Activate
          </Button>
        ) : null}
        {permissions.canSuspend ? (
          <>
            <Button variant="outline" size="sm" onClick={() => onAction("suspend")}>
              Suspend
            </Button>
            <Button variant="outline" size="sm" onClick={() => onAction("reactivate")}>
              Reactivate
            </Button>
          </>
        ) : null}
        {permissions.canEdit ? (
          <Button variant="outline" size="sm" onClick={() => onAction("archive")}>
            Archive
          </Button>
        ) : null}
        {permissions.canDelete ? (
          <Button variant="destructive" size="sm" onClick={() => onAction("delete")}>
            Delete
          </Button>
        ) : null}
      </div>
    </section>
  );
}
