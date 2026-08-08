"use client";

import {
  CheckSquare,
  Download,
  Eye,
  Loader2,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  Square,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { PlatformStatCard } from "@/modules/control-center/components/dashboard/platform-stat-card";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import { TenantConfirmDialog } from "@/modules/control-center/tenants/components/tenant-confirm-dialog";
import {
  bulkControlCenterOperatorAction,
  createControlCenterOperatorAction,
  exportControlCenterOperatorsCsvAction,
  queryControlCenterOperatorsAction,
} from "@/modules/control-center/operators/actions/control-center-operator-actions";
import {
  OperatorStatusBadge,
  operatorStatusBadgeVariant,
} from "@/modules/control-center/operators/components/operator-status-badge";
import {
  CONTROL_CENTER_OPERATOR_ROUTES,
  OPERATOR_ROLE_LABELS,
  OPERATOR_SORT_OPTIONS,
  OPERATOR_STATUS_FILTER_OPTIONS,
  PLATFORM_OPERATOR_ROLES,
} from "@/modules/control-center/operators/constants/control-center-operators";
import type {
  ControlCenterOperatorDirectoryResult,
  ControlCenterOperatorPermissions,
  PlatformOperatorRole,
} from "@/modules/control-center/operators/types/control-center-operators-types";

interface ControlCenterOperatorDirectoryProps {
  initialDirectory: ControlCenterOperatorDirectoryResult;
  permissions: ControlCenterOperatorPermissions;
}

type BulkAction = "activate" | "suspend" | "delete" | null;

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

export function ControlCenterOperatorDirectory({
  initialDirectory,
  permissions,
}: ControlCenterOperatorDirectoryProps) {
  const [isPending, startTransition] = useTransition();
  const [directory, setDirectory] = useState(initialDirectory);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState("");
  const [sortBy, setSortBy] = useState<(typeof OPERATOR_SORT_OPTIONS)[number]>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    role: "SUPPORT" as PlatformOperatorRole,
    department: "",
  });

  const allSelected = useMemo(
    () => directory.items.length > 0 && selectedIds.length === directory.items.length,
    [directory.items.length, selectedIds.length],
  );

  const loadDirectory = (page = directory.page) => {
    startTransition(async () => {
      try {
        const result = await queryControlCenterOperatorsAction({
          search: search || undefined,
          role: (role as PlatformOperatorRole) || null,
          status: (status as "active" | "suspended") || null,
          department: department || null,
          mfaEnabled: mfaEnabled === "" ? null : mfaEnabled === "true",
          sortBy,
          sortDirection,
          page,
        });
        setDirectory(result);
        setSelectedIds([]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load operator directory");
      }
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(directory.items.map((item) => item.id));
  };

  const toggleSelect = (operatorId: string) => {
    setSelectedIds((current) =>
      current.includes(operatorId)
        ? current.filter((id) => id !== operatorId)
        : [...current, operatorId],
    );
  };

  const runBulkAction = () => {
    if (!bulkAction || selectedIds.length === 0) return;

    startTransition(async () => {
      try {
        const result = await bulkControlCenterOperatorAction({
          operatorIds: selectedIds,
          action: bulkAction,
        });
        toast.success(`${result.succeeded.length} operators updated`);
        if (result.failed.length > 0) {
          toast.error(`${result.failed.length} operators failed`);
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
        const csv = await exportControlCenterOperatorsCsvAction({
          search: search || undefined,
          role: (role as PlatformOperatorRole) || null,
          status: (status as "active" | "suspended") || null,
          department: department || null,
          mfaEnabled: mfaEnabled === "" ? null : mfaEnabled === "true",
          sortBy,
          sortDirection,
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `busal-operators-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Operator export downloaded");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Export failed");
      }
    });
  };

  const handleCreate = () => {
    if (!createForm.fullName.trim() || !createForm.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    startTransition(async () => {
      try {
        await createControlCenterOperatorAction({
          fullName: createForm.fullName.trim(),
          email: createForm.email.trim(),
          role: createForm.role,
          department: createForm.department.trim() || null,
        });
        toast.success("Operator created");
        setCreateOpen(false);
        setCreateForm({ fullName: "", email: "", role: "SUPPORT", department: "" });
        loadDirectory(1);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to create operator");
      }
    });
  };

  const stats = directory.statistics;

  return (
    <PageContainer>
      <SectionHeader
        title="Operator Management"
        description="Manage Control Center operators, roles, permissions, and sessions."
        action={
          <div className="flex gap-2">
            {permissions.canExport ? (
              <Button variant="outline" size="sm" onClick={handleExport} disabled={isPending}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            ) : null}
            {permissions.canCreate ? (
              <Button size="sm" onClick={() => setCreateOpen(true)} disabled={isPending}>
                <Plus className="h-4 w-4" />
                Create Operator
              </Button>
            ) : null}
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <PlatformStatCard title="Total Operators" value={stats.totalOperators} />
        <PlatformStatCard title="Active" value={stats.activeOperators} />
        <PlatformStatCard title="Suspended" value={stats.suspendedOperators} />
        <PlatformStatCard title="MFA Enabled" value={stats.mfaEnabledOperators} />
        <PlatformStatCard title="Active Sessions" value={stats.activeSessions} />
        <PlatformStatCard title="Platform Owners" value={stats.platformOwners} />
      </section>

      <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2 xl:col-span-2">
          <Label htmlFor="operator-search">Search</Label>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              id="operator-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email, or department"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="operator-role">Role</Label>
          <select
            id="operator-role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All roles</option>
            {PLATFORM_OPERATOR_ROLES.map((option) => (
              <option key={option} value={option}>
                {OPERATOR_ROLE_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="operator-status">Status</Label>
          <select
            id="operator-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All statuses</option>
            {OPERATOR_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="operator-department">Department</Label>
          <Input
            id="operator-department"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            placeholder="Department"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="operator-mfa">MFA</Label>
          <select
            id="operator-mfa"
            value={mfaEnabled}
            onChange={(event) => setMfaEnabled(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All</option>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="operator-sort">Sort by</Label>
          <select
            id="operator-sort"
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as (typeof OPERATOR_SORT_OPTIONS)[number])
            }
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            {OPERATOR_SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="operator-sort-direction">Direction</Label>
          <select
            id="operator-sort-direction"
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

      {(permissions.canEdit || permissions.canSuspend || permissions.canDelete) &&
      selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
          <span className="text-muted-foreground text-sm">{selectedIds.length} selected</span>
          {permissions.canActivate ? (
            <Button variant="outline" size="sm" onClick={() => setBulkAction("activate")}>
              <PlayCircle className="h-4 w-4" />
              Activate
            </Button>
          ) : null}
          {permissions.canSuspend ? (
            <Button variant="outline" size="sm" onClick={() => setBulkAction("suspend")}>
              <PauseCircle className="h-4 w-4" />
              Suspend
            </Button>
          ) : null}
          {permissions.canDelete ? (
            <Button variant="outline" size="sm" onClick={() => setBulkAction("delete")}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          ) : null}
        </div>
      ) : null}

      {directory.items.length === 0 ? (
        <ControlCenterEmptyState
          title="No operators found"
          description="Adjust your filters or create a new Control Center operator."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {permissions.canEdit || permissions.canDelete ? (
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
                <TableHead>Operator</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>MFA</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directory.items.map((operator) => (
                <TableRow key={operator.id}>
                  {permissions.canEdit || permissions.canDelete ? (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(operator.id)}
                        onChange={() => toggleSelect(operator.id)}
                        aria-label={`Select ${operator.fullName}`}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{operator.fullName}</p>
                      <p className="text-muted-foreground text-xs">{operator.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <OperatorStatusBadge label={OPERATOR_ROLE_LABELS[operator.role]} />
                  </TableCell>
                  <TableCell>
                    <OperatorStatusBadge
                      label={operator.status}
                      variant={operatorStatusBadgeVariant(operator.status)}
                    />
                  </TableCell>
                  <TableCell>{operator.department ?? "—"}</TableCell>
                  <TableCell>{operator.mfaEnabled ? "Enabled" : "Disabled"}</TableCell>
                  <TableCell>{operator.activeSessions}</TableCell>
                  <TableCell>{operator.permissionCount}</TableCell>
                  <TableCell>{formatDate(operator.lastLoginAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="default" size="sm">
                      <Link href={CONTROL_CENTER_OPERATOR_ROUTES.detail(operator.id)}>
                        <Eye className="h-4 w-4" />
                        Open
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Showing {directory.items.length} of {directory.total} operators
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Operator</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Full name</Label>
              <Input
                id="create-name"
                value={createForm.fullName}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, fullName: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, email: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <select
                id="create-role"
                value={createForm.role}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    role: event.target.value as PlatformOperatorRole,
                  }))
                }
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              >
                {PLATFORM_OPERATOR_ROLES.filter((option) => option !== "PLATFORM_OWNER").map(
                  (option) => (
                    <option key={option} value={option}>
                      {OPERATOR_ROLE_LABELS[option]}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-department">Department</Label>
              <Input
                id="create-department"
                value={createForm.department}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, department: event.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TenantConfirmDialog
        open={Boolean(bulkAction)}
        title={`Bulk ${bulkAction ?? ""}`}
        description={`Apply ${bulkAction} to ${selectedIds.length} selected operators?`}
        confirmLabel={bulkAction ?? "Confirm"}
        destructive={bulkAction === "suspend" || bulkAction === "delete"}
        loading={isPending}
        onConfirm={runBulkAction}
        onOpenChange={(open) => {
          if (!open) setBulkAction(null);
        }}
      />
    </PageContainer>
  );
}
