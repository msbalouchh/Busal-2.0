"use client";

import {
  Download,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  assignControlCenterFeatureFlagTargetsAction,
  createControlCenterFeatureFlagAction,
  emergencyDisableControlCenterFeatureFlagAction,
  exportControlCenterFeatureFlagsAction,
  getControlCenterFeatureFlagDetailAction,
  importControlCenterFeatureFlagsAction,
  refreshControlCenterFeatureManagementAction,
  updateControlCenterFeatureFlagAction,
} from "@/modules/control-center/features/actions/control-center-feature-management-actions";
import {
  FeatureCategoryBadge,
  FeatureScopeBadge,
  FeatureStatusBadge,
} from "@/modules/control-center/features/components/feature-status-badge";
import {
  FEATURE_CATEGORIES,
  FEATURE_FLAG_TYPE_OPTIONS,
  FEATURE_SCOPES,
  FEATURE_STATUS_OPTIONS,
} from "@/modules/control-center/features/constants/control-center-feature-management";
import type {
  ControlCenterFeatureFlagDetail,
  ControlCenterFeatureFlagSummary,
  ControlCenterFeatureManagementBundle,
} from "@/modules/control-center/features/types/control-center-feature-management-types";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { ControlCenterErrorState } from "@/modules/control-center/components/dashboard/error-state";
import { PlatformStatCard } from "@/modules/control-center/components/dashboard/platform-stat-card";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import { TenantConfirmDialog } from "@/modules/control-center/tenants/components/tenant-confirm-dialog";

interface ControlCenterFeatureManagementHubProps {
  initialBundle: ControlCenterFeatureManagementBundle;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

function downloadExport(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ControlCenterFeatureManagementHub({
  initialBundle,
}: ControlCenterFeatureManagementHubProps) {
  const [isPending, startTransition] = useTransition();
  const [bundle, setBundle] = useState(initialBundle);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [page, setPage] = useState(bundle.directory.page);
  const [selectedFlag, setSelectedFlag] = useState<ControlCenterFeatureFlagDetail | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [confirmEmergency, setConfirmEmergency] = useState<string | null>(null);
  const [assignPlans, setAssignPlans] = useState("");
  const [assignBusinesses, setAssignBusinesses] = useState("");
  const [rolloutValue, setRolloutValue] = useState("0");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createForm, setCreateForm] = useState({
    key: "",
    name: "",
    module: "platform",
    flagType: "BOOLEAN",
    scope: "global",
    category: "standard",
    defaultEnabled: false,
    rolloutPercentage: "0",
    description: "",
  });

  const { overview, directory, permissions } = bundle;

  const buildQuery = (nextPage = page) => ({
    search: search.trim() || undefined,
    status: (statusFilter || undefined) as ControlCenterFeatureManagementBundle["directory"]["items"][number]["status"] | undefined,
    scope: (scopeFilter || undefined) as (typeof FEATURE_SCOPES)[number] | undefined,
    category: (categoryFilter || undefined) as (typeof FEATURE_CATEGORIES)[number] | undefined,
    module: moduleFilter || undefined,
    page: nextPage,
  });

  const refresh = (nextPage = page) => {
    setError(null);
    startTransition(async () => {
      try {
        const next = await refreshControlCenterFeatureManagementAction(buildQuery(nextPage));
        setBundle(next);
        setPage(next.directory.page);
      } catch (refreshError) {
        const message =
          refreshError instanceof Error ? refreshError.message : "Unable to refresh features";
        setError(message);
        toast.error(message);
      }
    });
  };

  const openDetail = (flag: ControlCenterFeatureFlagSummary) => {
    startTransition(async () => {
      try {
        const result = await getControlCenterFeatureFlagDetailAction(flag.id);
        setSelectedFlag(result.detail);
        setRolloutValue(String(result.detail.rolloutPercentage));
        setAssignPlans(
          result.detail.targets
            .filter((target) => target.targetType === "SUBSCRIPTION_PLAN")
            .map((target) => target.targetValue)
            .join("\n"),
        );
        setAssignBusinesses(
          result.detail.targets
            .filter((target) => target.targetType === "BUSINESS")
            .map((target) => target.targetValue)
            .join("\n"),
        );
      } catch (detailError) {
        toast.error(detailError instanceof Error ? detailError.message : "Unable to load feature");
      }
    });
  };

  const toggleFlag = (flag: ControlCenterFeatureFlagSummary, enabled: boolean) => {
    startTransition(async () => {
      try {
        await updateControlCenterFeatureFlagAction(flag.id, {
          status: enabled ? "ACTIVE" : "DRAFT",
          defaultEnabled: enabled,
          changeReason: enabled ? "Enabled from Control Center" : "Disabled from Control Center",
        });
        toast.success(enabled ? "Feature enabled" : "Feature disabled");
        refresh(page);
        if (selectedFlag?.id === flag.id) {
          openDetail(flag);
        }
      } catch (toggleError) {
        toast.error(toggleError instanceof Error ? toggleError.message : "Update failed");
      }
    });
  };

  const saveRollout = () => {
    if (!selectedFlag) return;
    startTransition(async () => {
      try {
        await updateControlCenterFeatureFlagAction(selectedFlag.id, {
          rolloutPercentage: Number(rolloutValue),
          changeReason: "Rollout percentage updated",
        });
        toast.success("Rollout updated");
        refresh(page);
        openDetail(selectedFlag);
      } catch (saveError) {
        toast.error(saveError instanceof Error ? saveError.message : "Unable to save rollout");
      }
    });
  };

  const saveAssignments = () => {
    if (!selectedFlag) return;
    startTransition(async () => {
      try {
        const planValues = assignPlans.split("\n").map((value) => value.trim()).filter(Boolean);
        const businessValues = assignBusinesses
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean);

        if (planValues.length > 0) {
          await assignControlCenterFeatureFlagTargetsAction({
            flagId: selectedFlag.id,
            targetType: "SUBSCRIPTION_PLAN",
            targetValues: planValues,
            changeReason: "Plan targets updated",
          });
        }

        if (businessValues.length > 0) {
          await assignControlCenterFeatureFlagTargetsAction({
            flagId: selectedFlag.id,
            targetType: "BUSINESS",
            targetValues: businessValues,
            changeReason: "Business targets updated",
          });
        }

        toast.success("Assignments saved");
        refresh(page);
        openDetail(selectedFlag);
      } catch (assignError) {
        toast.error(assignError instanceof Error ? assignError.message : "Assignment failed");
      }
    });
  };

  const handleCreate = () => {
    startTransition(async () => {
      try {
        await createControlCenterFeatureFlagAction({
          key: createForm.key.trim(),
          name: createForm.name.trim(),
          module: createForm.module.trim(),
          flagType: createForm.flagType as (typeof FEATURE_FLAG_TYPE_OPTIONS)[number],
          scope: createForm.scope as (typeof FEATURE_SCOPES)[number],
          category: createForm.category as (typeof FEATURE_CATEGORIES)[number],
          defaultEnabled: createForm.defaultEnabled,
          rolloutPercentage: Number(createForm.rolloutPercentage),
          description: createForm.description,
          changeReason: "Created from Feature Management",
        });
        toast.success("Feature flag created");
        setCreateOpen(false);
        refresh(1);
      } catch (createError) {
        toast.error(createError instanceof Error ? createError.message : "Create failed");
      }
    });
  };

  const handleExport = (format: "csv" | "json") => {
    startTransition(async () => {
      try {
        const result = await exportControlCenterFeatureFlagsAction(format);
        downloadExport(result.filename, result.content, result.mimeType);
        toast.success(`Exported ${format.toUpperCase()}`);
      } catch (exportError) {
        toast.error(exportError instanceof Error ? exportError.message : "Export failed");
      }
    });
  };

  const handleImport = () => {
    startTransition(async () => {
      try {
        const result = await importControlCenterFeatureFlagsAction({
          payload: importText,
          changeReason: "Imported from Feature Management",
        });
        toast.success(`Imported ${result.created} created, ${result.updated} updated`);
        setImportOpen(false);
        setImportText("");
        refresh(1);
      } catch (importError) {
        toast.error(importError instanceof Error ? importError.message : "Import failed");
      }
    });
  };

  const filteredCount = useMemo(() => directory.total, [directory.total]);

  if (!permissions.canView) {
    return (
      <PageContainer>
        <ControlCenterErrorState
          title="Access denied"
          description="You do not have permission to view feature management."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader
        title="Feature Management"
        description="Manage global, plan, tenant, business, and workspace feature flags with rollout controls and audit history."
        action={
          <div className="flex flex-wrap gap-2">
            {permissions.canExport ? (
              <>
                <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleExport("csv")}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleExport("json")}>
                  <Download className="mr-2 h-4 w-4" />
                  JSON
                </Button>
              </>
            ) : null}
            {permissions.canImport ? (
              <Button variant="outline" size="sm" disabled={isPending} onClick={() => setImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            ) : null}
            {permissions.canEdit ? (
              <Button size="sm" disabled={isPending} onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New feature
              </Button>
            ) : null}
            <Button variant="outline" size="sm" disabled={isPending} onClick={() => refresh()}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PlatformStatCard title="Total Features" value={overview.totalFlags} />
        <PlatformStatCard title="Active" value={overview.activeFlags} />
        <PlatformStatCard title="Beta / Experimental" value={overview.betaFlags + overview.experimentalFlags} />
        <PlatformStatCard title="Emergency Switches" value={overview.emergencyFlags} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-2 xl:col-span-2">
          <Label htmlFor="feature-search">Search</Label>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              id="feature-search"
              className="pl-9"
              placeholder="Key, name, or description"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && refresh(1)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="feature-status">Status</Label>
          <select
            id="feature-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All statuses</option>
            {FEATURE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="feature-scope">Scope</Label>
          <select
            id="feature-scope"
            value={scopeFilter}
            onChange={(event) => setScopeFilter(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All scopes</option>
            {FEATURE_SCOPES.map((scope) => (
              <option key={scope} value={scope}>
                {scope}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="feature-category">Category</Label>
          <select
            id="feature-category"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All categories</option>
            {FEATURE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <select
          value={moduleFilter}
          onChange={(event) => setModuleFilter(event.target.value)}
          className="border-input bg-background h-10 rounded-md border px-3 text-sm"
        >
          <option value="">All modules</option>
          {bundle.filterOptions.modules.map((moduleName) => (
            <option key={moduleName} value={moduleName}>
              {moduleName}
            </option>
          ))}
        </select>
        <Button disabled={isPending} onClick={() => refresh(1)}>
          Apply filters
        </Button>
      </div>

      {error ? (
        <div className="mt-6">
          <ControlCenterErrorState title="Unable to load features" description={error} />
        </div>
      ) : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Feature flags ({filteredCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {directory.items.length === 0 ? (
            <ControlCenterEmptyState
              title="No feature flags"
              description="Create a feature flag or adjust your filters."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rollout</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {directory.items.map((flag) => (
                    <TableRow key={flag.id}>
                      <TableCell>
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => openDetail(flag)}
                        >
                          <div className="font-medium">{flag.name}</div>
                          <div className="text-muted-foreground text-xs">{flag.key}</div>
                        </button>
                      </TableCell>
                      <TableCell>
                        <FeatureScopeBadge scope={flag.scope} />
                      </TableCell>
                      <TableCell>
                        <FeatureCategoryBadge category={flag.category} />
                      </TableCell>
                      <TableCell>
                        <FeatureStatusBadge status={flag.status} />
                      </TableCell>
                      <TableCell>{flag.rolloutPercentage}%</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(flag.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openDetail(flag)}>
                            Details
                          </Button>
                          {permissions.canEdit ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isPending}
                                onClick={() => toggleFlag(flag, !flag.defaultEnabled)}
                              >
                                {flag.defaultEnabled ? "Disable" : "Enable"}
                              </Button>
                              {flag.category === "emergency" || flag.status === "ACTIVE" ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={isPending}
                                  onClick={() => setConfirmEmergency(flag.id)}
                                >
                                  Kill
                                </Button>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {directory.totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">
                    Page {directory.page} of {directory.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending || directory.page <= 1}
                      onClick={() => {
                        const nextPage = directory.page - 1;
                        setPage(nextPage);
                        refresh(nextPage);
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending || directory.page >= directory.totalPages}
                      onClick={() => {
                        const nextPage = directory.page + 1;
                        setPage(nextPage);
                        refresh(nextPage);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedFlag)} onOpenChange={(open) => !open && setSelectedFlag(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selectedFlag ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedFlag.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <FeatureStatusBadge status={selectedFlag.status} />
                  <FeatureScopeBadge scope={selectedFlag.scope} />
                  <FeatureCategoryBadge category={selectedFlag.category} />
                </div>
                <p className="text-muted-foreground text-sm">{selectedFlag.description || "No description"}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Key</Label>
                    <p className="text-sm">{selectedFlag.key}</p>
                  </div>
                  <div>
                    <Label>Module</Label>
                    <p className="text-sm">{selectedFlag.module}</p>
                  </div>
                  <div>
                    <Label>Version</Label>
                    <p className="text-sm">v{selectedFlag.currentVersion}</p>
                  </div>
                  <div>
                    <Label>Expires</Label>
                    <p className="text-sm">{formatDate(selectedFlag.expiresAt)}</p>
                  </div>
                </div>

                {permissions.canEdit ? (
                  <div className="space-y-3 rounded-lg border p-4">
                    <Label htmlFor="rollout">Rollout percentage</Label>
                    <div className="flex gap-2">
                      <Input
                        id="rollout"
                        type="number"
                        min={0}
                        max={100}
                        value={rolloutValue}
                        onChange={(event) => setRolloutValue(event.target.value)}
                      />
                      <Button disabled={isPending} onClick={saveRollout}>
                        Save rollout
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assign-plans">Assign to plans (one per line)</Label>
                      <textarea
                        id="assign-plans"
                        className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                        value={assignPlans}
                        onChange={(event) => setAssignPlans(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assign-businesses">Assign to businesses / workspaces (one ID per line)</Label>
                      <textarea
                        id="assign-businesses"
                        className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                        value={assignBusinesses}
                        onChange={(event) => setAssignBusinesses(event.target.value)}
                      />
                    </div>
                    <Button disabled={isPending} onClick={saveAssignments}>
                      Save assignments
                    </Button>
                  </div>
                ) : null}

                <div>
                  <h3 className="mb-2 font-medium">Targets</h3>
                  {selectedFlag.targets.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No targets assigned.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {selectedFlag.targets.map((target) => (
                        <li key={target.id}>
                          {target.targetType}: {target.targetValue}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 font-medium">Version history</h3>
                  {selectedFlag.versions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No versions recorded.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {selectedFlag.versions.map((version) => (
                        <li key={version.id}>
                          v{version.version} · {formatDate(version.createdAt)} · {version.changeReason ?? "—"}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 font-medium">Audit history</h3>
                  {selectedFlag.audit.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No audit entries.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {selectedFlag.audit.map((entry) => (
                        <li key={entry.id}>
                          {entry.eventType} · {entry.actorEmail ?? "System"} · {formatDate(entry.createdAt)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create feature flag</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="create-key">Key</Label>
              <Input
                id="create-key"
                value={createForm.key}
                onChange={(event) => setCreateForm((current) => ({ ...current, key: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-scope">Scope</Label>
                <select
                  id="create-scope"
                  value={createForm.scope}
                  onChange={(event) => setCreateForm((current) => ({ ...current, scope: event.target.value }))}
                  className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                >
                  {FEATURE_SCOPES.map((scope) => (
                    <option key={scope} value={scope}>
                      {scope}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-category">Category</Label>
                <select
                  id="create-category"
                  value={createForm.category}
                  onChange={(event) => setCreateForm((current) => ({ ...current, category: event.target.value }))}
                  className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                >
                  {FEATURE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending} onClick={handleCreate}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import feature flags</DialogTitle>
          </DialogHeader>
          <textarea
            className="border-input bg-background min-h-40 w-full rounded-md border px-3 py-2 text-sm"
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder="Paste JSON array export"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              file.text().then(setImportText);
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Upload JSON
            </Button>
            <Button disabled={isPending || !importText.trim()} onClick={handleImport}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TenantConfirmDialog
        open={Boolean(confirmEmergency)}
        onOpenChange={(open) => !open && setConfirmEmergency(null)}
        title="Emergency disable"
        description="This will immediately disable the feature flag and mark it as an emergency kill switch."
        confirmLabel="Emergency disable"
        destructive
        loading={isPending}
        onConfirm={() => {
          if (!confirmEmergency) return;
          startTransition(async () => {
            try {
              await emergencyDisableControlCenterFeatureFlagAction(
                confirmEmergency,
                "Emergency kill switch activated from Control Center",
              );
              toast.success("Feature emergency disabled");
              setConfirmEmergency(null);
              setSelectedFlag(null);
              refresh(page);
            } catch (killError) {
              toast.error(killError instanceof Error ? killError.message : "Emergency disable failed");
            }
          });
        }}
      />
    </PageContainer>
  );
}
