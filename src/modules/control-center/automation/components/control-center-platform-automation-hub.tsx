"use client";

import {
  AlertTriangle,
  Copy,
  Download,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Workflow,
  Zap,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Badge } from "@/components/ui/badge";
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
import { AnalyticsTrendBars } from "@/modules/control-center/analytics/components/analytics-trend-bars";
import {
  cloneControlCenterPlatformAutomationAction,
  createControlCenterPlatformAutomationAction,
  deleteControlCenterPlatformAutomationAction,
  emergencyStopControlCenterPlatformAutomationsAction,
  exportControlCenterPlatformAutomationAction,
  getControlCenterPlatformAutomationDetailAction,
  getControlCenterPlatformAutomationExecutionDetailAction,
  pauseControlCenterPlatformAutomationAction,
  refreshControlCenterPlatformAutomationAction,
  resumeControlCenterPlatformAutomationAction,
  retryControlCenterPlatformAutomationExecutionAction,
  runControlCenterPlatformAutomationAction,
} from "@/modules/control-center/automation/actions/control-center-platform-automation-actions";
import {
  PLATFORM_AUTOMATION_ACTION_TYPES,
  PLATFORM_AUTOMATION_CATEGORIES,
  PLATFORM_AUTOMATION_PRIORITIES,
  PLATFORM_AUTOMATION_STATUSES,
  PLATFORM_AUTOMATION_TRIGGERS,
} from "@/modules/control-center/automation/constants/control-center-platform-automation";
import type {
  PlatformAutomationDetail,
  PlatformAutomationExecutionDetail,
  PlatformAutomationManagementBundle,
  PlatformAutomationSummary,
} from "@/modules/control-center/automation/types/control-center-platform-automation-types";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { ControlCenterErrorState } from "@/modules/control-center/components/dashboard/error-state";
import { PlatformStatCard } from "@/modules/control-center/components/dashboard/platform-stat-card";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import { TenantConfirmDialog } from "@/modules/control-center/tenants/components/tenant-confirm-dialog";

interface ControlCenterPlatformAutomationHubProps {
  initialBundle: PlatformAutomationManagementBundle;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
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

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
    case "completed":
      return "default";
    case "paused":
    case "draft":
    case "pending":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

export function ControlCenterPlatformAutomationHub({
  initialBundle,
}: ControlCenterPlatformAutomationHubProps) {
  const [isPending, startTransition] = useTransition();
  const [bundle, setBundle] = useState(initialBundle);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [page, setPage] = useState(bundle.directory.page);
  const [activeTab, setActiveTab] = useState<"automations" | "executions" | "audit">("automations");
  const [selectedAutomation, setSelectedAutomation] = useState<PlatformAutomationDetail | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<PlatformAutomationExecutionDetail | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmEmergency, setConfirmEmergency] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    category: "platform" as (typeof PLATFORM_AUTOMATION_CATEGORIES)[number],
    priority: "medium" as (typeof PLATFORM_AUTOMATION_PRIORITIES)[number],
    triggerType: "manual" as (typeof PLATFORM_AUTOMATION_TRIGGERS)[number],
    actionType: "publish_orchestration_event" as (typeof PLATFORM_AUTOMATION_ACTION_TYPES)[number],
    enabled: false,
  });

  const { overview, directory, executions, auditTrail, permissions } = bundle;

  const buildQuery = (nextPage = page) => ({
    search: search.trim() || undefined,
    category: (categoryFilter || undefined) as PlatformAutomationManagementBundle["directory"]["items"][number]["category"] | undefined,
    status: (statusFilter || undefined) as PlatformAutomationManagementBundle["directory"]["items"][number]["status"] | undefined,
    trigger: (triggerFilter || undefined) as PlatformAutomationManagementBundle["directory"]["items"][number]["triggerType"] | undefined,
    priority: (priorityFilter || undefined) as PlatformAutomationManagementBundle["directory"]["items"][number]["priority"] | undefined,
    page: nextPage,
  });

  const refresh = (nextPage = page) => {
    setError(null);
    startTransition(async () => {
      try {
        const next = await refreshControlCenterPlatformAutomationAction(buildQuery(nextPage));
        setBundle(next);
        setPage(next.directory.page);
      } catch (refreshError) {
        const message =
          refreshError instanceof Error ? refreshError.message : "Unable to refresh automations";
        setError(message);
        toast.error(message);
      }
    });
  };

  const openAutomationDetail = (automation: PlatformAutomationSummary) => {
    startTransition(async () => {
      try {
        const result = await getControlCenterPlatformAutomationDetailAction(automation.id);
        setSelectedAutomation(result.detail);
      } catch (detailError) {
        toast.error(detailError instanceof Error ? detailError.message : "Unable to load detail");
      }
    });
  };

  const openExecutionDetail = (executionId: string) => {
    startTransition(async () => {
      try {
        const result = await getControlCenterPlatformAutomationExecutionDetailAction(executionId);
        setSelectedExecution(result.detail);
      } catch (detailError) {
        toast.error(detailError instanceof Error ? detailError.message : "Unable to load execution");
      }
    });
  };

  const handleCreate = () => {
    startTransition(async () => {
      try {
        await createControlCenterPlatformAutomationAction({
          name: createForm.name.trim(),
          description: createForm.description.trim(),
          category: createForm.category,
          priority: createForm.priority,
          enabled: createForm.enabled,
          trigger: {
            type: createForm.triggerType,
            configuration: {},
          },
          actions: [
            {
              id: crypto.randomUUID(),
              type: createForm.actionType,
              order: 1,
              configuration: {},
            },
          ],
        });
        setCreateOpen(false);
        setCreateForm({
          name: "",
          description: "",
          category: "platform",
          priority: "medium",
          triggerType: "manual",
          actionType: "publish_orchestration_event",
          enabled: false,
        });
        toast.success("Automation created");
        refresh(1);
      } catch (createError) {
        toast.error(createError instanceof Error ? createError.message : "Create failed");
      }
    });
  };

  const handleRun = (automationId: string) => {
    startTransition(async () => {
      try {
        const result = await runControlCenterPlatformAutomationAction(automationId);
        toast.success(`Execution completed in ${formatDuration(result.durationMs)}`);
        setSelectedExecution(result);
        refresh();
      } catch (runError) {
        toast.error(runError instanceof Error ? runError.message : "Execution failed");
      }
    });
  };

  const handleExport = (format: "csv" | "json") => {
    startTransition(async () => {
      try {
        const result = await exportControlCenterPlatformAutomationAction(format);
        downloadExport(result.filename, result.content, result.mimeType);
        toast.success(`Exported ${format.toUpperCase()}`);
      } catch (exportError) {
        toast.error(exportError instanceof Error ? exportError.message : "Export failed");
      }
    });
  };

  const executionTrend = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of executions.items) {
      const day = entry.startedAt.slice(0, 10);
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([day, value]) => ({ day, value }));
  }, [executions.items]);

  if (!permissions.canView) {
    return (
      <PageContainer>
        <ControlCenterErrorState
          title="Access denied"
          description="You do not have permission to view the Platform Automation Center."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader
        title="Platform Automation Center"
        description="Automate platform operations across businesses, subscriptions, monitoring, AI, and orchestration."
        action={
          <div className="flex flex-wrap items-center gap-2">
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
            {permissions.canEmergencyStop ? (
              <Button variant="destructive" size="sm" disabled={isPending} onClick={() => setConfirmEmergency(true)}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Emergency Stop
              </Button>
            ) : null}
            {permissions.canCreate ? (
              <Button size="sm" disabled={isPending} onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create
              </Button>
            ) : null}
            <Button variant="outline" size="sm" disabled={isPending} onClick={() => refresh()}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="mt-4">
          <ControlCenterErrorState title="Automation error" description={error} onRetry={() => refresh()} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PlatformStatCard title="Total Automations" value={overview.totalAutomations} icon={Workflow} />
        <PlatformStatCard title="Running" value={overview.running} icon={Play} />
        <PlatformStatCard title="Paused" value={overview.paused} icon={Pause} />
        <PlatformStatCard title="Failed Today" value={overview.failedExecutionsToday} icon={AlertTriangle} />
        <PlatformStatCard title="Executions Today" value={overview.executionsToday} icon={Zap} />
        <PlatformStatCard title="Success Rate" value={`${overview.successRate}%`} icon={Workflow} />
        <PlatformStatCard title="Avg Execution" value={formatDuration(overview.averageExecutionMs)} icon={Zap} />
        <PlatformStatCard title="Active Categories" value={overview.activeCategories} icon={Workflow} />
      </div>

      {executionTrend.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Execution Volume (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsTrendBars points={executionTrend} />
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {(["automations", "executions", "audit"] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab)}
          >
            {tab === "automations" ? "Automations" : tab === "executions" ? "Execution History" : "Audit Trail"}
          </Button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <Label htmlFor="automation-search">Search</Label>
          <div className="relative mt-1">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              id="automation-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search automations, owners, businesses..."
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="category-filter">Category</Label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="border-input bg-background mt-1 h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All categories</option>
            {PLATFORM_AUTOMATION_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="status-filter">Status</Label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border-input bg-background mt-1 h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All statuses</option>
            {PLATFORM_AUTOMATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="trigger-filter">Trigger</Label>
          <select
            id="trigger-filter"
            value={triggerFilter}
            onChange={(event) => setTriggerFilter(event.target.value)}
            className="border-input bg-background mt-1 h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All triggers</option>
            {PLATFORM_AUTOMATION_TRIGGERS.map((trigger) => (
              <option key={trigger} value={trigger}>
                {trigger}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" disabled={isPending} onClick={() => refresh(1)}>
          Apply Filters
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearch("");
            setCategoryFilter("");
            setStatusFilter("");
            setTriggerFilter("");
            setPriorityFilter("");
            refresh(1);
          }}
        >
          Clear
        </Button>
      </div>

      {activeTab === "automations" ? (
        directory.items.length === 0 ? (
          <div className="mt-6">
            <ControlCenterEmptyState
              title="No platform automations"
              description="Create your first platform automation to orchestrate business lifecycle, billing, monitoring, and AI workflows."
            />
            {permissions.canCreate ? (
              <div className="mt-4 flex justify-center">
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create automation
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <Card className="mt-6">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Success</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {directory.items.map((automation) => (
                    <TableRow key={automation.id}>
                      <TableCell>
                        <button
                          type="button"
                          className="text-left font-medium hover:underline"
                          onClick={() => openAutomationDetail(automation)}
                        >
                          {automation.name}
                        </button>
                        {automation.businessName ? (
                          <p className="text-muted-foreground text-xs">{automation.businessName}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>{automation.category}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(automation.status)}>{automation.status}</Badge>
                      </TableCell>
                      <TableCell>{automation.triggerType}</TableCell>
                      <TableCell>{automation.priority}</TableCell>
                      <TableCell>
                        {automation.successRate !== null ? `${automation.successRate}%` : "—"}
                      </TableCell>
                      <TableCell>{formatDate(automation.lastExecutedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {permissions.canExecute ? (
                            <Button variant="ghost" size="icon" disabled={isPending} onClick={() => handleRun(automation.id)}>
                              <Play className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {permissions.canEdit ? (
                            automation.status === "paused" || !automation.enabled ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isPending}
                                onClick={() => {
                                  startTransition(async () => {
                                    await resumeControlCenterPlatformAutomationAction(automation.id);
                                    toast.success("Automation resumed");
                                    refresh();
                                  });
                                }}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isPending}
                                onClick={() => {
                                  startTransition(async () => {
                                    await pauseControlCenterPlatformAutomationAction(automation.id);
                                    toast.success("Automation paused");
                                    refresh();
                                  });
                                }}
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            )
                          ) : null}
                          {permissions.canCreate ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isPending}
                              onClick={() => {
                                startTransition(async () => {
                                  await cloneControlCenterPlatformAutomationAction(automation.id);
                                  toast.success("Automation cloned");
                                  refresh();
                                });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {permissions.canDelete ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isPending}
                              onClick={() => setConfirmDelete(automation.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : null}

      {activeTab === "executions" ? (
        executions.items.length === 0 ? (
          <div className="mt-6">
            <ControlCenterEmptyState
              title="No executions yet"
              description="Run a platform automation manually or wait for trigger-based executions."
            />
          </div>
        ) : (
          <Card className="mt-6">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Automation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.items.map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell>
                        <button
                          type="button"
                          className="text-left font-medium hover:underline"
                          onClick={() => openExecutionDetail(execution.id)}
                        >
                          {execution.automationName}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(execution.status)}>{execution.status}</Badge>
                      </TableCell>
                      <TableCell>{execution.triggerType}</TableCell>
                      <TableCell>{formatDuration(execution.durationMs)}</TableCell>
                      <TableCell>{formatDate(execution.startedAt)}</TableCell>
                      <TableCell className="text-right">
                        {execution.status === "failed" && permissions.canExecute ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() => {
                              startTransition(async () => {
                                const result =
                                  await retryControlCenterPlatformAutomationExecutionAction(execution.id);
                                toast.success("Retry completed");
                                setSelectedExecution(result);
                                refresh();
                              });
                            }}
                          >
                            Retry
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => openExecutionDetail(execution.id)}>
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : null}

      {activeTab === "audit" ? (
        auditTrail.items.length === 0 ? (
          <div className="mt-6">
            <ControlCenterEmptyState
              title="No audit entries"
              description="Automation lifecycle and execution events will appear here."
            />
          </div>
        ) : (
          <Card className="mt-6">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Automation</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditTrail.items.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.eventType}</TableCell>
                      <TableCell>{entry.automationName ?? "—"}</TableCell>
                      <TableCell>{entry.actorEmail}</TableCell>
                      <TableCell>{entry.message}</TableCell>
                      <TableCell>{formatDate(entry.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : null}

      <Dialog open={selectedAutomation !== null} onOpenChange={(open) => !open && setSelectedAutomation(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedAutomation?.name ?? "Automation Detail"}</DialogTitle>
          </DialogHeader>
          {selectedAutomation ? (
            <div className="mt-6 space-y-4 text-sm">
              <p className="text-muted-foreground">{selectedAutomation.description || "No description"}</p>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Category</span><p>{selectedAutomation.category}</p></div>
                <div><span className="text-muted-foreground">Status</span><p>{selectedAutomation.status}</p></div>
                <div><span className="text-muted-foreground">Trigger</span><p>{selectedAutomation.trigger.type}</p></div>
                <div><span className="text-muted-foreground">Priority</span><p>{selectedAutomation.priority}</p></div>
              </div>
              <div>
                <p className="mb-2 font-medium">Conditions ({selectedAutomation.conditions.length})</p>
                {selectedAutomation.conditions.length === 0 ? (
                  <p className="text-muted-foreground">No conditions configured.</p>
                ) : (
                  <ul className="space-y-1">
                    {selectedAutomation.conditions.map((condition) => (
                      <li key={condition.id} className="rounded-md border p-2">
                        {condition.field} {condition.operator} {condition.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-2 font-medium">Actions ({selectedAutomation.actions.length})</p>
                <ul className="space-y-1">
                  {selectedAutomation.actions.map((action) => (
                    <li key={action.id} className="rounded-md border p-2">
                      {action.order}. {action.type}
                    </li>
                  ))}
                </ul>
              </div>
              {permissions.canExecute ? (
                <Button disabled={isPending} onClick={() => handleRun(selectedAutomation.id)}>
                  <Play className="mr-2 h-4 w-4" />
                  Run manually
                </Button>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={selectedExecution !== null} onOpenChange={(open) => !open && setSelectedExecution(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Execution Timeline</DialogTitle>
          </DialogHeader>
          {selectedExecution ? (
            <div className="mt-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Automation</span><p>{selectedExecution.automationName}</p></div>
                <div><span className="text-muted-foreground">Status</span><p>{selectedExecution.status}</p></div>
                <div><span className="text-muted-foreground">Duration</span><p>{formatDuration(selectedExecution.durationMs)}</p></div>
                <div><span className="text-muted-foreground">Started</span><p>{formatDate(selectedExecution.startedAt)}</p></div>
              </div>
              {selectedExecution.error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive">
                  {selectedExecution.error}
                </div>
              ) : null}
              <div>
                <p className="mb-2 font-medium">Execution Logs</p>
                <ul className="max-h-64 space-y-2 overflow-y-auto">
                  {selectedExecution.logs.map((log, index) => (
                    <li key={`${log.timestamp}-${index}`} className="rounded-md border p-2">
                      <p className="text-muted-foreground text-xs">{formatDate(log.timestamp)} · {log.level}</p>
                      <p>{log.message}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Platform Automation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="create-description">Description</Label>
              <Input
                id="create-description"
                value={createForm.description}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="create-category">Category</Label>
                <select
                  id="create-category"
                  value={createForm.category}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      category: event.target.value as typeof createForm.category,
                    }))
                  }
                  className="border-input bg-background mt-1 h-10 w-full rounded-md border px-3 text-sm"
                >
                  {PLATFORM_AUTOMATION_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="create-priority">Priority</Label>
                <select
                  id="create-priority"
                  value={createForm.priority}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      priority: event.target.value as typeof createForm.priority,
                    }))
                  }
                  className="border-input bg-background mt-1 h-10 w-full rounded-md border px-3 text-sm"
                >
                  {PLATFORM_AUTOMATION_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="create-trigger">Trigger</Label>
                <select
                  id="create-trigger"
                  value={createForm.triggerType}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      triggerType: event.target.value as typeof createForm.triggerType,
                    }))
                  }
                  className="border-input bg-background mt-1 h-10 w-full rounded-md border px-3 text-sm"
                >
                  {PLATFORM_AUTOMATION_TRIGGERS.map((trigger) => (
                    <option key={trigger} value={trigger}>
                      {trigger}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="create-action">Primary Action</Label>
                <select
                  id="create-action"
                  value={createForm.actionType}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      actionType: event.target.value as typeof createForm.actionType,
                    }))
                  }
                  className="border-input bg-background mt-1 h-10 w-full rounded-md border px-3 text-sm"
                >
                  {PLATFORM_AUTOMATION_ACTION_TYPES.map((actionType) => (
                    <option key={actionType} value={actionType}>
                      {actionType}
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
            <Button disabled={isPending || !createForm.name.trim()} onClick={handleCreate}>
              Create automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TenantConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete automation?"
        description="This automation will be archived and disabled. Execution history is preserved."
        confirmLabel="Delete"
        destructive
        loading={isPending}
        onConfirm={() => {
          if (!confirmDelete) return;
          startTransition(async () => {
            await deleteControlCenterPlatformAutomationAction(confirmDelete);
            toast.success("Automation deleted");
            setConfirmDelete(null);
            refresh();
          });
        }}
      />

      <TenantConfirmDialog
        open={confirmEmergency}
        onOpenChange={setConfirmEmergency}
        title="Emergency stop all automations?"
        description="This will pause every active platform automation immediately."
        confirmLabel="Emergency Stop"
        destructive
        loading={isPending}
        onConfirm={() => {
          startTransition(async () => {
            const result = await emergencyStopControlCenterPlatformAutomationsAction();
            toast.success(`Paused ${result.stopped} automations`);
            setConfirmEmergency(false);
            refresh();
          });
        }}
      />
    </PageContainer>
  );
}
