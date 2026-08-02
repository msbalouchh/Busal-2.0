"use client";

import { Activity, Download, Loader2, RefreshCw, Search } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
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
import {
  acknowledgeControlCenterAlertAction,
  escalateControlCenterAlertAction,
  exportControlCenterLogsAction,
  queryControlCenterAlertsAction,
  queryControlCenterIncidentsAction,
  queryControlCenterLogsAction,
  refreshControlCenterMonitoringBundleAction,
  resolveControlCenterAlertAction,
  resolveControlCenterIncidentAction,
} from "@/modules/control-center/monitoring/actions/control-center-monitoring-actions";
import {
  MonitoringStatusBadge,
  platformStatusBadge,
} from "@/modules/control-center/monitoring/components/monitoring-status-badge";
import {
  CONTROL_CENTER_MONITORING_REFRESH_MS,
  LOG_LEVEL_OPTIONS,
} from "@/modules/control-center/monitoring/constants/control-center-monitoring";
import type {
  ControlCenterAlertItem,
  ControlCenterIncidentItem,
  ControlCenterMonitoringManagementBundle,
} from "@/modules/control-center/monitoring/types/control-center-monitoring-types";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { PlatformStatCard } from "@/modules/control-center/components/dashboard/platform-stat-card";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
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
        const label = String(entry.hour ?? entry.day ?? index);

        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div className="bg-primary/80 w-full rounded-t" style={{ height: `${height}%` }} />
            <span className="text-muted-foreground text-[10px]">{label.slice(-5)}</span>
          </div>
        );
      })}
    </div>
  );
}

interface ControlCenterMonitoringHubProps {
  bundle: ControlCenterMonitoringManagementBundle;
  view?: "full" | "ai";
}

export function ControlCenterMonitoringHub({
  bundle: initialBundle,
  view = "full",
}: ControlCenterMonitoringHubProps) {
  const isAiView = view === "ai";
  const [isPending, startTransition] = useTransition();
  const [bundle, setBundle] = useState(initialBundle);
  const [logSearch, setLogSearch] = useState("");
  const [logLevel, setLogLevel] = useState("");
  const [logs, setLogs] = useState(bundle.logs);
  const [alerts, setAlerts] = useState(bundle.alerts);
  const [incidents, setIncidents] = useState(bundle.incidents);
  const [selectedAlert, setSelectedAlert] = useState<ControlCenterAlertItem | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<ControlCenterIncidentItem | null>(null);

  const {
    widgets,
    permissions,
    services,
    infrastructure,
    apiMonitoring,
    aiMonitoring,
    refreshedAt,
  } = bundle;

  const refreshAll = () => {
    startTransition(async () => {
      try {
        const next = await refreshControlCenterMonitoringBundleAction();
        setBundle(next);
        setLogs(next.logs);
        setAlerts(next.alerts);
        setIncidents(next.incidents);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to refresh monitoring data");
      }
    });
  };

  useEffect(() => {
    const timer = window.setInterval(refreshAll, CONTROL_CENTER_MONITORING_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const loadLogs = () => {
    startTransition(async () => {
      try {
        const result = await queryControlCenterLogsAction({
          search: logSearch || undefined,
          level: (logLevel || undefined) as never,
        });
        setLogs(result);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load logs");
      }
    });
  };

  const exportLogs = () => {
    startTransition(async () => {
      try {
        const csv = await exportControlCenterLogsAction({
          search: logSearch || undefined,
          level: (logLevel || undefined) as never,
        });
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `busal-logs-${Date.now()}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
        toast.success("Logs exported");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Export failed");
      }
    });
  };

  const runAlertAction = (action: () => Promise<void>, message: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(message);
        const nextAlerts = await queryControlCenterAlertsAction({ status: "OPEN" });
        setAlerts(nextAlerts);
        refreshAll();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  return (
    <PageContainer className="gap-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader
          title={isAiView ? "AI Platform" : "Platform Monitoring & Observability"}
          description={
            isAiView
              ? "Cross-tenant AI usage, model performance, cost trends, and platform queue health."
              : "Platform health, services, infrastructure, API, AI, alerts, logs, and incidents."
          }
        />
        <Button variant="outline" onClick={refreshAll} disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <p className="text-muted-foreground text-xs">
        Last updated {formatDate(refreshedAt)} · auto-refresh every 30s
      </p>

      {!isAiView ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Platform Status</CardTitle>
            </CardHeader>
            <CardContent>{platformStatusBadge(String(widgets.platformStatus))}</CardContent>
          </Card>
          <PlatformStatCard title="Health Score" value={`${widgets.overallHealthScore}%`} />
          <PlatformStatCard title="Active Services" value={widgets.activeServices} />
          <PlatformStatCard title="Availability" value={`${widgets.serviceAvailabilityPct}%`} />
          <PlatformStatCard title="Uptime" value={`${widgets.uptimePct}%`} />
          <PlatformStatCard title="Current Incidents" value={widgets.currentIncidents} />
          <PlatformStatCard title="Active Alerts" value={widgets.activeAlerts} />
          <PlatformStatCard title="System Load" value={`${widgets.systemLoadPct}%`} />
        </div>
      ) : null}

      {!isAiView ? (
        <>
          <section className="space-y-4">
            <SectionHeader title="Service Monitoring" />
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left">Service</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Latency</th>
                    <th className="px-4 py-2 text-left">Error Rate</th>
                    <th className="px-4 py-2 text-left">Throughput</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.key} className="border-t">
                      <td className="px-4 py-2">{service.name}</td>
                      <td className="px-4 py-2">
                        <MonitoringStatusBadge status={service.status} />
                      </td>
                      <td className="px-4 py-2">{service.latencyMs} ms</td>
                      <td className="px-4 py-2">{service.errorRatePct}%</td>
                      <td className="px-4 py-2">{service.throughput}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {permissions.canViewInfrastructure ? (
            <section className="space-y-4">
              <SectionHeader title="Infrastructure Monitoring" />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <PlatformStatCard title="CPU Usage" value={`${infrastructure.cpuUsagePct}%`} />
                <PlatformStatCard
                  title="Memory Usage"
                  value={`${infrastructure.memoryUsagePct}%`}
                />
                <PlatformStatCard title="Disk Usage" value={`${infrastructure.diskUsagePct}%`} />
                <PlatformStatCard
                  title="Network Usage"
                  value={`${infrastructure.networkUsagePct}%`}
                />
                <PlatformStatCard title="Queue Length" value={infrastructure.queueLength} />
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Workers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>{infrastructure.workerCount} active</p>
                    <MonitoringStatusBadge status={infrastructure.workerStatus} />
                  </CardContent>
                </Card>
              </div>
            </section>
          ) : null}

          <section className="space-y-4">
            <SectionHeader title="API Monitoring" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <PlatformStatCard title="Request Volume" value={apiMonitoring.requestVolume} />
              <PlatformStatCard
                title="Avg Response"
                value={`${apiMonitoring.avgResponseTimeMs} ms`}
              />
              <PlatformStatCard title="Error Rate" value={`${apiMonitoring.errorRatePct}%`} />
              <PlatformStatCard title="Success Rate" value={`${apiMonitoring.successRatePct}%`} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Slow Endpoints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {apiMonitoring.slowEndpoints.length === 0 ? (
                    <p className="text-muted-foreground">No slow endpoints detected.</p>
                  ) : (
                    apiMonitoring.slowEndpoints.map((entry) => (
                      <div
                        key={entry.endpoint}
                        className="flex justify-between border-b pb-2 last:border-0"
                      >
                        <span className="truncate pr-2">{entry.endpoint}</span>
                        <span>{entry.avgMs} ms</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Endpoints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {apiMonitoring.topEndpoints.map((entry) => (
                    <div
                      key={entry.endpoint}
                      className="flex justify-between border-b pb-2 last:border-0"
                    >
                      <span className="truncate pr-2">{entry.endpoint}</span>
                      <span>{entry.count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">API Usage Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {apiMonitoring.usageTrends.length === 0 ? (
                  <ControlCenterEmptyState
                    title="No API traffic"
                    description="Request trends will appear here."
                  />
                ) : (
                  <TrendBars data={apiMonitoring.usageTrends} valueKey="requests" />
                )}
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}

      {permissions.canViewAiMonitoring ? (
        <section className="space-y-4">
          <SectionHeader title="AI Monitoring" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <PlatformStatCard
              title="Token Usage"
              value={aiMonitoring.tokenUsage.toLocaleString()}
            />
            <PlatformStatCard
              title="Response Time"
              value={`${aiMonitoring.avgResponseTimeMs} ms`}
            />
            <PlatformStatCard title="AI Errors" value={aiMonitoring.errorCount} />
            <PlatformStatCard title="Queue Status" value={aiMonitoring.queueLength} />
            <PlatformStatCard
              title="Cost Trend"
              value={`£${(aiMonitoring.costTrendCents / 100).toFixed(2)}`}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Model Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {aiMonitoring.modelPerformance.length === 0 ? (
                  <p className="text-muted-foreground">No AI performance data yet.</p>
                ) : (
                  aiMonitoring.modelPerformance.map((entry) => (
                    <div
                      key={entry.model}
                      className="flex justify-between border-b pb-2 last:border-0"
                    >
                      <span>{entry.model}</span>
                      <span>
                        {entry.avgMs} ms · {entry.executions} runs
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Usage Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendBars data={aiMonitoring.usageTrends} valueKey="tokens" />
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {!isAiView && permissions.canManageAlerts ? (
        <section className="space-y-4">
          <SectionHeader title="Alerts" />
          <div className="grid gap-4 md:grid-cols-3">
            {alerts.rules.slice(0, 3).map((rule) => (
              <Card key={rule.alertType}>
                <CardHeader>
                  <CardTitle className="text-base">{rule.alertType.replace(/_/g, " ")}</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{rule.count}</CardContent>
              </Card>
            ))}
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Alert</th>
                  <th className="px-4 py-2 text-left">Severity</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Tenant</th>
                  <th className="px-4 py-2 text-left">Triggered</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8">
                      <ControlCenterEmptyState
                        title="No alerts"
                        description="Platform alerts will appear here."
                      />
                    </td>
                  </tr>
                ) : (
                  alerts.items.map((alert) => (
                    <tr key={alert.id} className="border-t">
                      <td className="px-4 py-2">{alert.title}</td>
                      <td className="px-4 py-2">{alert.severity}</td>
                      <td className="px-4 py-2">
                        <MonitoringStatusBadge status={alert.status} />
                      </td>
                      <td className="px-4 py-2">{alert.businessName ?? "Platform"}</td>
                      <td className="px-4 py-2">{formatDate(alert.triggeredAt)}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedAlert(alert)}>
                            Details
                          </Button>
                          {alert.status === "OPEN" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() =>
                                runAlertAction(
                                  () => acknowledgeControlCenterAlertAction(alert.id),
                                  "Alert acknowledged",
                                )
                              }
                            >
                              Acknowledge
                            </Button>
                          ) : null}
                          {alert.status !== "RESOLVED" ? (
                            <>
                              <Button
                                size="sm"
                                disabled={isPending}
                                onClick={() =>
                                  runAlertAction(
                                    () => resolveControlCenterAlertAction(alert.id),
                                    "Alert resolved",
                                  )
                                }
                              >
                                Resolve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isPending}
                                onClick={() =>
                                  runAlertAction(
                                    () => escalateControlCenterAlertAction(alert.id),
                                    "Alert escalated",
                                  )
                                }
                              >
                                Escalate
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!isAiView && permissions.canViewLogs ? (
        <section className="space-y-4">
          <SectionHeader title="Logs Explorer" />
          <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="log-search">Global Search</Label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  id="log-search"
                  className="pl-9"
                  value={logSearch}
                  onChange={(event) => setLogSearch(event.target.value)}
                  placeholder="Search message, source, correlation ID"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="log-level">Severity</Label>
              <select
                id="log-level"
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={logLevel}
                onChange={(event) => setLogLevel(event.target.value)}
              >
                <option value="">All levels</option>
                {LOG_LEVEL_OPTIONS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={loadLogs} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Filter
              </Button>
              <Button variant="outline" onClick={exportLogs} disabled={isPending}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Level</th>
                  <th className="px-4 py-2 text-left">Service</th>
                  <th className="px-4 py-2 text-left">Tenant</th>
                  <th className="px-4 py-2 text-left">Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8">
                      <ControlCenterEmptyState
                        title="No logs found"
                        description="Adjust filters or search terms."
                      />
                    </td>
                  </tr>
                ) : (
                  logs.items.map((log) => (
                    <tr key={log.id} className="border-t">
                      <td className="px-4 py-2">{formatDate(log.createdAt)}</td>
                      <td className="px-4 py-2">
                        <MonitoringStatusBadge status={log.level} />
                      </td>
                      <td className="px-4 py-2">{log.source}</td>
                      <td className="px-4 py-2">{log.businessName ?? "Platform"}</td>
                      <td className="max-w-md truncate px-4 py-2">{log.message}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!isAiView && permissions.canViewIncidents ? (
        <section className="space-y-4">
          <SectionHeader title="Incident Timeline" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active Incidents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {incidents.items.filter((item) => item.status !== "RESOLVED").length === 0 ? (
                  <ControlCenterEmptyState
                    title="No active incidents"
                    description="All systems operational."
                  />
                ) : (
                  incidents.items
                    .filter((item) => item.status !== "RESOLVED")
                    .map((incident) => (
                      <div key={incident.id} className="rounded border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{incident.title}</p>
                          <MonitoringStatusBadge status={incident.severity} />
                        </div>
                        <p className="text-muted-foreground mt-1">
                          {formatDate(incident.createdAt)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => setSelectedIncident(incident)}
                        >
                          View timeline
                        </Button>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Past Incidents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {incidents.items.filter((item) => item.status === "RESOLVED").length === 0 ? (
                  <p className="text-muted-foreground">
                    No resolved incidents in the last 30 days.
                  </p>
                ) : (
                  incidents.items
                    .filter((item) => item.status === "RESOLVED")
                    .slice(0, 5)
                    .map((incident) => (
                      <div
                        key={incident.id}
                        className="flex justify-between border-b pb-2 last:border-0"
                      >
                        <span className="truncate pr-2">{incident.title}</span>
                        <span>{formatDate(incident.resolvedAt)}</span>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      <Drawer open={selectedAlert != null} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>{selectedAlert?.title ?? "Alert Detail"}</DrawerTitle>
            <DrawerDescription>{selectedAlert?.severity}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 overflow-y-auto px-4 pb-4 text-sm">
            <p>{selectedAlert?.message}</p>
            <p>
              Status:{" "}
              {selectedAlert ? <MonitoringStatusBadge status={selectedAlert.status} /> : null}
            </p>
            <p>Tenant: {selectedAlert?.businessName ?? "Platform"}</p>
            <p>Triggered: {formatDate(selectedAlert?.triggeredAt ?? null)}</p>
            {selectedAlert?.escalated ? <p className="text-destructive">Escalated</p> : null}
          </div>
          {selectedAlert && selectedAlert.status !== "RESOLVED" ? (
            <DrawerFooter className="flex-row gap-2">
              <Button
                disabled={isPending}
                onClick={() =>
                  runAlertAction(
                    () => resolveControlCenterAlertAction(selectedAlert.id),
                    "Alert resolved",
                  )
                }
              >
                Resolve
              </Button>
            </DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>

      <Drawer
        open={selectedIncident != null}
        onOpenChange={(open) => !open && setSelectedIncident(null)}
      >
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>{selectedIncident?.title ?? "Incident Detail"}</DrawerTitle>
            <DrawerDescription>{selectedIncident?.severity.replace(/_/g, " ")}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 overflow-y-auto px-4 pb-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <p>
                Status:{" "}
                {selectedIncident ? (
                  <MonitoringStatusBadge status={selectedIncident.status} />
                ) : null}
              </p>
              <p>Resolution: {selectedIncident?.resolutionStatus}</p>
              <p>Root cause: {selectedIncident?.rootCause ?? "—"}</p>
              <p>Assigned: {selectedIncident?.assignedStaff ?? "Unassigned"}</p>
            </div>
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-medium">
                <Activity className="h-4 w-4" />
                Timeline
              </h4>
              <ul className="space-y-2">
                {selectedIncident?.timeline.map((entry, index) => (
                  <li key={`${entry.at}-${index}`} className="border-l-2 pl-3">
                    <p className="text-muted-foreground text-xs">{formatDate(entry.at)}</p>
                    <p>{entry.event}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {selectedIncident && selectedIncident.status !== "RESOLVED" ? (
            <DrawerFooter>
              <Button
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    try {
                      await resolveControlCenterIncidentAction(selectedIncident.id);
                      toast.success("Incident resolved");
                      const next = await queryControlCenterIncidentsAction({});
                      setIncidents(next);
                      setSelectedIncident(null);
                      refreshAll();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Action failed");
                    }
                  });
                }}
              >
                Resolve Incident
              </Button>
            </DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>
    </PageContainer>
  );
}
