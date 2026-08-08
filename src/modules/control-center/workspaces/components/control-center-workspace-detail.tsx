"use client";

import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import { TenantActivityTimeline } from "@/modules/control-center/tenants/components/tenant-activity-timeline";
import { TenantConfirmDialog } from "@/modules/control-center/tenants/components/tenant-confirm-dialog";
import {
  activateControlCenterWorkspaceAction,
  archiveControlCenterWorkspaceAction,
  deleteControlCenterWorkspaceAction,
  suspendControlCenterWorkspaceAction,
  transferControlCenterWorkspaceOwnershipAction,
  updateControlCenterWorkspaceAction,
} from "@/modules/control-center/workspaces/actions/control-center-workspace-actions";
import {
  WorkspaceStatusBadge,
  workspaceHealthBadgeVariant,
  workspaceLifecycleBadgeVariant,
} from "@/modules/control-center/workspaces/components/workspace-status-badge";
import { CONTROL_CENTER_WORKSPACE_ROUTES } from "@/modules/control-center/workspaces/constants/control-center-workspaces";
import type { ControlCenterWorkspaceDetailBundle } from "@/modules/control-center/workspaces/types/control-center-workspaces-types";
import { TenantPlatformLists } from "@/modules/tenant-platform/components/tenant-platform-lists";

interface ControlCenterWorkspaceDetailProps {
  bundle: ControlCenterWorkspaceDetailBundle;
}

type ConfirmAction = "activate" | "suspend" | "archive" | "delete" | null;

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

function formatCurrency(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

function formatBytes(value: string): string {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
}

function storageUsagePercent(used: string, max: string | null): number {
  if (!max) return 0;
  const usedBytes = Number(used);
  const maxBytes = Number(max);
  if (!Number.isFinite(usedBytes) || !Number.isFinite(maxBytes) || maxBytes <= 0) return 0;
  return (usedBytes / maxBytes) * 100;
}

export function ControlCenterWorkspaceDetail({ bundle }: ControlCenterWorkspaceDetailProps) {
  const { profile, permissions } = bundle;
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [form, setForm] = useState({
    workspaceName: profile.workspaceName ?? "",
    industry: profile.industry ?? "",
    country: profile.country ?? "",
    timezone: profile.timezone ?? "",
    currency: profile.currency ?? "",
  });

  const runLifecycle = (action: Exclude<ConfirmAction, null>) => {
    startTransition(async () => {
      try {
        switch (action) {
          case "activate":
            await activateControlCenterWorkspaceAction(profile.workspaceId);
            toast.success("Workspace activated");
            break;
          case "suspend":
            await suspendControlCenterWorkspaceAction(profile.workspaceId);
            toast.success("Workspace suspended");
            break;
          case "archive":
            await archiveControlCenterWorkspaceAction(profile.workspaceId);
            toast.success("Workspace archived");
            break;
          case "delete":
            await deleteControlCenterWorkspaceAction(profile.workspaceId);
            toast.success("Workspace deleted");
            break;
        }
        setConfirmAction(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateControlCenterWorkspaceAction({
          workspaceId: profile.workspaceId,
          ...form,
        });
        toast.success("Workspace profile updated");
        setIsEditing(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update workspace");
      }
    });
  };

  const handleTransferOwnership = () => {
    if (!newOwnerId.trim()) {
      toast.error("Enter a new owner user ID");
      return;
    }

    startTransition(async () => {
      try {
        await transferControlCenterWorkspaceOwnershipAction({
          workspaceId: profile.workspaceId,
          newOwnerId: newOwnerId.trim(),
        });
        toast.success("Ownership transferred");
        setNewOwnerId("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Transfer failed");
      }
    });
  };

  const usagePercent = storageUsagePercent(
    profile.usage.storageUsedBytes,
    profile.usage.maxStorageBytes,
  );

  return (
    <PageContainer>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={CONTROL_CENTER_WORKSPACE_ROUTES.directory}>
            <ArrowLeft className="h-4 w-4" />
            Back to directory
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <WorkspaceStatusBadge label={profile.status} />
          <WorkspaceStatusBadge
            label={profile.lifecycleStatus}
            variant={workspaceLifecycleBadgeVariant(profile.lifecycleStatus)}
          />
          <WorkspaceStatusBadge
            label={profile.healthStatus}
            variant={workspaceHealthBadgeVariant(profile.healthStatus)}
          />
        </div>
      </div>

      <SectionHeader
        title={profile.workspaceName ?? "Workspace profile"}
        description="Cross-tenant workspace profile, subscription, usage, health, and operational activity."
        action={
          permissions.canEdit ? (
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? "Save changes" : "Edit profile"}
            </Button>
          ) : null
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Branches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{profile.branches.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{profile.users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(profile.subscription.mrrPence)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">AI Tokens (month)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {profile.usage.aiTokensThisMonth.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workspace Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {isEditing ? (
              <>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="workspace-name">Workspace name</Label>
                  <Input
                    id="workspace-name"
                    value={form.workspaceName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, workspaceName: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={form.industry}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, industry: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={form.country}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, country: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={form.timezone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, timezone: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={form.currency}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, currency: event.target.value }))
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Workspace ID</p>
                  <p className="text-sm font-medium">{profile.workspaceId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Business ID</p>
                  <p className="text-sm font-medium">{profile.businessId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Slug</p>
                  <p className="text-sm font-medium">{profile.slug}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Industry</p>
                  <p className="text-sm font-medium">{profile.industry ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Country</p>
                  <p className="text-sm font-medium">{profile.country ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Timezone</p>
                  <p className="text-sm font-medium">{profile.timezone ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Created</p>
                  <p className="text-sm font-medium">{formatDate(profile.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Last activity</p>
                  <p className="text-sm font-medium">{formatDate(profile.lastActivityAt)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground text-xs uppercase">Name</p>
              <p className="text-sm font-medium">
                {profile.owner.fullName ?? profile.owner.email}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Email</p>
              <p className="text-sm font-medium">{profile.owner.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">User ID</p>
              <p className="text-sm font-medium">{profile.owner.id}</p>
            </div>
            {permissions.canTransfer ? (
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="new-owner-id">Transfer ownership</Label>
                <div className="flex gap-2">
                  <Input
                    id="new-owner-id"
                    value={newOwnerId}
                    onChange={(event) => setNewOwnerId(event.target.value)}
                    placeholder="New owner user ID"
                  />
                  <Button variant="outline" onClick={handleTransferOwnership} disabled={isPending}>
                    Transfer
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs uppercase">Plan</p>
              <p className="text-sm font-medium">{profile.subscription.plan ?? "None"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Status</p>
              <p className="text-sm font-medium">{profile.subscription.status}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">MRR</p>
              <p className="text-sm font-medium">{formatCurrency(profile.subscription.mrrPence)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health Status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs uppercase">Health status</p>
              <p className="text-sm font-medium">
                {profile.health?.healthStatus ?? profile.healthStatus}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Checks</p>
              <p className="text-sm font-medium">
                {profile.health?.checks?.length ?? 0} health checks
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Storage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Used</span>
              <span>{formatBytes(profile.usage.storageUsedBytes)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Limit</span>
              <span>
                {profile.usage.maxStorageBytes
                  ? formatBytes(profile.usage.maxStorageBytes)
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Usage</span>
              <span>{usagePercent.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tokens (month)</span>
              <span>{profile.usage.aiTokensThisMonth.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Token limit</span>
              <span>
                {profile.usage.maxAiTokensPerMonth?.toLocaleString() ?? "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active users</span>
              <span>{profile.usage.activeUsers.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Businesses</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.businesses.length === 0 ? (
            <p className="text-muted-foreground text-sm">No businesses mapped.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Branches</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.businesses.map((business) => (
                  <TableRow key={business.id}>
                    <TableCell>{business.name}</TableCell>
                    <TableCell>{business.industry ?? "—"}</TableCell>
                    <TableCell>{business.branchCount}</TableCell>
                    <TableCell>{business.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branches</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.branches.length === 0 ? (
            <p className="text-muted-foreground text-sm">No branches configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell>
                      {branch.name}
                      {branch.isMain ? " (Main)" : ""}
                    </TableCell>
                    <TableCell>
                      {[branch.city, branch.country].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell>{branch.staffCount}</TableCell>
                    <TableCell>{branch.isActive ? "Active" : "Inactive"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.users.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <TenantActivityTimeline items={profile.activities} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <TenantPlatformLists auditLogs={profile.auditLogs} />
          </CardContent>
        </Card>
      </section>

      {(permissions.canEdit || permissions.canSuspend || permissions.canDelete) && (
        <section className="flex flex-wrap gap-2 rounded-lg border p-4">
          {permissions.canEdit && profile.lifecycleStatus !== "ACTIVE" ? (
            <Button variant="outline" onClick={() => setConfirmAction("activate")}>
              Activate
            </Button>
          ) : null}
          {permissions.canSuspend && profile.lifecycleStatus === "ACTIVE" ? (
            <Button variant="outline" onClick={() => setConfirmAction("suspend")}>
              Suspend
            </Button>
          ) : null}
          {permissions.canEdit && profile.lifecycleStatus !== "ARCHIVED" ? (
            <Button variant="outline" onClick={() => setConfirmAction("archive")}>
              Archive
            </Button>
          ) : null}
          {permissions.canDelete ? (
            <Button variant="destructive" onClick={() => setConfirmAction("delete")}>
              Delete
            </Button>
          ) : null}
        </section>
      )}

      <TenantConfirmDialog
        open={Boolean(confirmAction)}
        title={`Confirm ${confirmAction}`}
        description={`Are you sure you want to ${confirmAction} this workspace?`}
        confirmLabel={confirmAction ?? "Confirm"}
        destructive={confirmAction === "suspend" || confirmAction === "delete"}
        loading={isPending}
        onConfirm={() => {
          if (confirmAction) runLifecycle(confirmAction);
        }}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      />
    </PageContainer>
  );
}
