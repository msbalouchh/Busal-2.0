"use client";

import type { TenantHealthStatus } from "@prisma/client";
import {
  Archive,
  CheckSquare,
  Download,
  Eye,
  Loader2,
  PauseCircle,
  PlayCircle,
  Search,
  Square,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  bulkControlCenterWorkspaceAction,
  exportControlCenterWorkspacesCsvAction,
  getControlCenterWorkspaceDetailAction,
  queryControlCenterWorkspacesAction,
} from "@/modules/control-center/workspaces/actions/control-center-workspace-actions";
import {
  WorkspaceStatusBadge,
  workspaceHealthBadgeVariant,
} from "@/modules/control-center/workspaces/components/workspace-status-badge";
import {
  WORKSPACE_HEALTH_FILTER_OPTIONS,
  WORKSPACE_PLAN_FILTER_OPTIONS,
  WORKSPACE_SORT_OPTIONS,
  WORKSPACE_STATUS_FILTER_OPTIONS,
  CONTROL_CENTER_WORKSPACE_ROUTES,
} from "@/modules/control-center/workspaces/constants/control-center-workspaces";
import type {
  ControlCenterWorkspaceDirectoryItem,
  ControlCenterWorkspaceDirectoryResult,
  ControlCenterWorkspacePermissions,
  ControlCenterWorkspaceProfile,
} from "@/modules/control-center/workspaces/types/control-center-workspaces-types";
import type { WorkspaceStatus } from "@/modules/tenant/types/status";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { PlatformStatCard } from "@/modules/control-center/components/dashboard/platform-stat-card";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import { TenantConfirmDialog } from "@/modules/control-center/tenants/components/tenant-confirm-dialog";

interface ControlCenterWorkspaceDirectoryProps {
  initialDirectory: ControlCenterWorkspaceDirectoryResult;
  permissions: ControlCenterWorkspacePermissions;
}

type BulkAction = "suspend" | "activate" | "archive" | null;

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

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

export function ControlCenterWorkspaceDirectory({
  initialDirectory,
  permissions,
}: ControlCenterWorkspaceDirectoryProps) {
  const [isPending, startTransition] = useTransition();
  const [directory, setDirectory] = useState(initialDirectory);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [healthStatus, setHealthStatus] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("");
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [sortBy, setSortBy] = useState<(typeof WORKSPACE_SORT_OPTIONS)[number]>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);
  const [drawerWorkspace, setDrawerWorkspace] = useState<ControlCenterWorkspaceProfile | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const allSelected = useMemo(
    () => directory.items.length > 0 && selectedIds.length === directory.items.length,
    [directory.items.length, selectedIds.length],
  );

  const loadDirectory = (page = directory.page) => {
    startTransition(async () => {
      try {
        const result = await queryControlCenterWorkspacesAction({
          search: search || undefined,
          status: (status as WorkspaceStatus) || null,
          healthStatus: (healthStatus as TenantHealthStatus) || null,
          subscriptionPlan: subscriptionPlan || null,
          industry: industry || null,
          country: country || null,
          sortBy,
          sortDirection,
          page,
        });
        setDirectory(result);
        setSelectedIds([]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load workspace directory");
      }
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(directory.items.map((item) => item.workspaceId));
  };

  const toggleSelect = (workspaceId: string) => {
    setSelectedIds((current) =>
      current.includes(workspaceId)
        ? current.filter((id) => id !== workspaceId)
        : [...current, workspaceId],
    );
  };

  const openDrawer = (item: ControlCenterWorkspaceDirectoryItem) => {
    setDrawerLoading(true);
    startTransition(async () => {
      try {
        const profile = await getControlCenterWorkspaceDetailAction(item.workspaceId);
        setDrawerWorkspace(profile);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load workspace profile");
      } finally {
        setDrawerLoading(false);
      }
    });
  };

  const runBulkAction = () => {
    if (!bulkAction || selectedIds.length === 0) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await bulkControlCenterWorkspaceAction({
          workspaceIds: selectedIds,
          action: bulkAction,
        });
        toast.success(`${result.succeeded.length} workspaces updated`);
        if (result.failed.length > 0) {
          toast.error(`${result.failed.length} workspaces failed`);
        }
        setBulkAction(null);
        loadDirectory(directory.page);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Bulk action failed");
      }
    });
  };

  const handleExport = () => {
    startTransition(async () => {
      try {
        const csv = await exportControlCenterWorkspacesCsvAction({
          search: search || undefined,
          status: (status as WorkspaceStatus) || null,
          healthStatus: (healthStatus as TenantHealthStatus) || null,
          subscriptionPlan: subscriptionPlan || null,
          industry: industry || null,
          country: country || null,
          sortBy,
          sortDirection,
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `busal-workspaces-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Workspace export downloaded");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Export failed");
      }
    });
  };

  const stats = directory.statistics;

  return (
    <PageContainer>
      <SectionHeader
        title="Workspace Management"
        description="Search, filter, and manage workspaces across the Busal platform."
        action={
          permissions.canExport ? (
            <Button variant="outline" size="sm" onClick={handleExport} disabled={isPending}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          ) : null
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PlatformStatCard title="Total Workspaces" value={stats.totalWorkspaces} />
        <PlatformStatCard title="Active" value={stats.activeWorkspaces} />
        <PlatformStatCard title="Provisioning" value={stats.provisioningWorkspaces} />
        <PlatformStatCard title="Archived" value={stats.archivedWorkspaces} />
        <PlatformStatCard title="Total Branches" value={stats.totalBranches} />
        <PlatformStatCard title="Total Users" value={stats.totalUsers} />
        <PlatformStatCard
          title="Platform MRR"
          value={formatCurrency(stats.totalMrrPence)}
          className="xl:col-span-2"
        />
      </section>

      <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2 xl:col-span-2">
          <Label htmlFor="workspace-search">Search</Label>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              id="workspace-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Workspace name, owner, or email"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="workspace-status">Status</Label>
          <select
            id="workspace-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All statuses</option>
            {WORKSPACE_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="workspace-health">Health</Label>
          <select
            id="workspace-health"
            value={healthStatus}
            onChange={(event) => setHealthStatus(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All health states</option>
            {WORKSPACE_HEALTH_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="workspace-plan">Plan</Label>
          <select
            id="workspace-plan"
            value={subscriptionPlan}
            onChange={(event) => setSubscriptionPlan(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All plans</option>
            {WORKSPACE_PLAN_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="workspace-industry-filter">Industry</Label>
          <Input
            id="workspace-industry-filter"
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
            placeholder="Industry"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workspace-country">Country</Label>
          <Input
            id="workspace-country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            placeholder="Country code"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workspace-sort">Sort by</Label>
          <select
            id="workspace-sort"
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as (typeof WORKSPACE_SORT_OPTIONS)[number])
            }
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            {WORKSPACE_SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="workspace-sort-direction">Direction</Label>
          <select
            id="workspace-sort-direction"
            value={sortDirection}
            onChange={(event) => setSortDirection(event.target.value as "asc" | "desc")}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div className="flex items-end">
          <Button onClick={() => loadDirectory(1)} disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply filters"}
          </Button>
        </div>
      </div>

      {permissions.canEdit && selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
          <span className="text-muted-foreground text-sm">{selectedIds.length} selected</span>
          <Button variant="outline" size="sm" onClick={() => setBulkAction("activate")}>
            <PlayCircle className="h-4 w-4" />
            Activate
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBulkAction("suspend")}>
            <PauseCircle className="h-4 w-4" />
            Suspend
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBulkAction("archive")}>
            <Archive className="h-4 w-4" />
            Archive
          </Button>
        </div>
      ) : null}

      {directory.items.length === 0 ? (
        <ControlCenterEmptyState
          title="No workspaces found"
          description="Adjust your filters to find workspaces on the platform."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {permissions.canEdit ? (
                  <TableHead className="w-10">
                    <button type="button" onClick={toggleSelectAll} aria-label="Select all">
                      {allSelected ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                ) : null}
                <TableHead>Workspace</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>AI Usage</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directory.items.map((workspace) => (
                <TableRow key={workspace.workspaceId}>
                  {permissions.canEdit ? (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(workspace.workspaceId)}
                        onChange={() => toggleSelect(workspace.workspaceId)}
                        aria-label={`Select ${workspace.workspaceName}`}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{workspace.workspaceName}</p>
                      <p className="text-muted-foreground text-xs">{workspace.ownerEmail}</p>
                      <p className="text-muted-foreground text-xs">{workspace.workspaceId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <WorkspaceStatusBadge label={workspace.status} />
                      <WorkspaceStatusBadge
                        label={workspace.healthStatus}
                        variant={workspaceHealthBadgeVariant(workspace.healthStatus)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>{workspace.subscriptionPlan ?? "—"}</TableCell>
                  <TableCell>{workspace.branchCount}</TableCell>
                  <TableCell>{workspace.userCount}</TableCell>
                  <TableCell>{formatCurrency(workspace.mrrPence)}</TableCell>
                  <TableCell>{workspace.aiTokensThisMonth.toLocaleString()}</TableCell>
                  <TableCell>{formatBytes(workspace.storageUsedBytes)}</TableCell>
                  <TableCell>{formatDate(workspace.lastActivityAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openDrawer(workspace)}>
                        Quick view
                      </Button>
                      <Button asChild variant="default" size="sm">
                        <Link href={CONTROL_CENTER_WORKSPACE_ROUTES.detail(workspace.workspaceId)}>
                          <Eye className="h-4 w-4" />
                          Open
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Showing {directory.items.length} of {directory.total} workspaces
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={directory.page <= 1 || isPending}
            onClick={() => loadDirectory(directory.page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={directory.page >= directory.totalPages || isPending}
            onClick={() => loadDirectory(directory.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Drawer open={Boolean(drawerWorkspace) || drawerLoading} onOpenChange={() => setDrawerWorkspace(null)}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{drawerWorkspace?.workspaceName ?? "Workspace profile"}</DrawerTitle>
            <DrawerDescription>
              {drawerWorkspace?.owner.email ?? "Loading workspace details..."}
            </DrawerDescription>
          </DrawerHeader>
          {drawerLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : drawerWorkspace ? (
            <div className="space-y-4 overflow-y-auto px-4 pb-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Status</p>
                  <p className="text-sm font-medium">{drawerWorkspace.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Health</p>
                  <p className="text-sm font-medium">{drawerWorkspace.healthStatus}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Branches / Users</p>
                  <p className="text-sm font-medium">
                    {drawerWorkspace.branches.length} / {drawerWorkspace.users.length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">MRR</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(drawerWorkspace.subscription.mrrPence)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          {drawerWorkspace ? (
            <DrawerFooter>
              <Button asChild>
                <Link href={CONTROL_CENTER_WORKSPACE_ROUTES.detail(drawerWorkspace.workspaceId)}>
                  Open full profile
                </Link>
              </Button>
            </DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>

      <TenantConfirmDialog
        open={Boolean(bulkAction)}
        title={`Bulk ${bulkAction ?? ""}`}
        description={`Apply ${bulkAction} to ${selectedIds.length} selected workspaces?`}
        confirmLabel={`${bulkAction ?? "Confirm"}`}
        destructive={bulkAction === "suspend" || bulkAction === "archive"}
        loading={isPending}
        onConfirm={runBulkAction}
        onOpenChange={(open) => {
          if (!open) setBulkAction(null);
        }}
      />
    </PageContainer>
  );
}
