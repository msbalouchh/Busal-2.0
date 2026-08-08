"use client";

import { Download, Loader2, RefreshCw, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  bulkRevokeControlCenterSecuritySessionsAction,
  disableControlCenterSecurityAccountAction,
  enableControlCenterSecurityAccountAction,
  exportControlCenterSecurityReportAction,
  lockControlCenterSecurityAccountAction,
  queryControlCenterSecurityEventsAction,
  queryControlCenterSecuritySessionsAction,
  refreshControlCenterSecurityBundleAction,
  rotateControlCenterSecurityApiKeyAction,
  terminateControlCenterSecuritySessionAction,
  unlockControlCenterSecurityAccountAction,
} from "@/modules/control-center/security/actions/control-center-security-actions";
import {
  SECURITY_EVENT_FILTER_OPTIONS,
} from "@/modules/control-center/security/constants/control-center-security";
import type {
  ControlCenterSecurityEventItem,
  ControlCenterSecurityManagementBundle,
  ControlCenterSecuritySessionItem,
} from "@/modules/control-center/security/types/control-center-security-types";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { ControlCenterErrorState } from "@/modules/control-center/components/dashboard/error-state";
import { PlatformStatCard } from "@/modules/control-center/components/dashboard/platform-stat-card";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import { TenantConfirmDialog } from "@/modules/control-center/tenants/components/tenant-confirm-dialog";

interface ControlCenterSecurityHubProps {
  initialBundle: ControlCenterSecurityManagementBundle;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

function SecurityStatusBadge({ label, variant }: { label: string; variant?: "danger" | "warn" | "ok" }) {
  const classes =
    variant === "danger"
      ? "bg-destructive/10 text-destructive"
      : variant === "warn"
        ? "bg-amber-500/10 text-amber-600"
        : "bg-emerald-500/10 text-emerald-600";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium uppercase ${classes}`}>
      {label}
    </span>
  );
}

export function ControlCenterSecurityHub({ initialBundle }: ControlCenterSecurityHubProps) {
  const [isPending, startTransition] = useTransition();
  const [bundle, setBundle] = useState(initialBundle);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [operatorOnly, setOperatorOnly] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [confirmBulkRevoke, setConfirmBulkRevoke] = useState(false);
  const [events, setEvents] = useState<ControlCenterSecurityEventItem[]>(initialBundle.recentEvents);

  const { overview, passwordPolicy, permissions, sessions, mfaStatus, apiKeys, alerts, lockedAccounts } =
    bundle;

  const refreshBundle = () => {
    setError(null);
    startTransition(async () => {
      try {
        const next = await refreshControlCenterSecurityBundleAction({
          search: search || undefined,
          operatorOnly,
        });
        setBundle(next);
        setEvents(next.recentEvents);
        setSelectedSessionIds([]);
      } catch (refreshError) {
        const message =
          refreshError instanceof Error ? refreshError.message : "Unable to refresh security center";
        setError(message);
        toast.error(message);
      }
    });
  };

  const loadSessions = () => {
    startTransition(async () => {
      try {
        const result = await queryControlCenterSecuritySessionsAction({
          search: search || undefined,
          operatorOnly,
        });
        setBundle((current) => ({ ...current, sessions: result }));
        setSelectedSessionIds([]);
      } catch (loadError) {
        toast.error(loadError instanceof Error ? loadError.message : "Unable to load sessions");
      }
    });
  };

  const loadEvents = () => {
    startTransition(async () => {
      try {
        const result = await queryControlCenterSecurityEventsAction({
          search: search || undefined,
          eventType: (eventType || null) as ControlCenterSecurityEventItem["eventType"] | null,
          page: 1,
          pageSize: 20,
        });
        setEvents(result.items);
      } catch (loadError) {
        toast.error(loadError instanceof Error ? loadError.message : "Unable to load events");
      }
    });
  };

  const handleTerminateSession = (sessionId: string) => {
    startTransition(async () => {
      try {
        await terminateControlCenterSecuritySessionAction(sessionId);
        toast.success("Session terminated");
        loadSessions();
      } catch (actionError) {
        toast.error(actionError instanceof Error ? actionError.message : "Unable to terminate session");
      }
    });
  };

  const handleBulkRevoke = () => {
    startTransition(async () => {
      try {
        const result = await bulkRevokeControlCenterSecuritySessionsAction({
          sessionIds: selectedSessionIds,
        });
        toast.success(`${result.succeeded.length} sessions revoked`);
        if (result.failed.length > 0) {
          toast.error(`${result.failed.length} sessions failed`);
        }
        setConfirmBulkRevoke(false);
        loadSessions();
      } catch (actionError) {
        toast.error(actionError instanceof Error ? actionError.message : "Bulk revoke failed");
      }
    });
  };

  const handleAccountAction = (
    action: "lock" | "unlock" | "disable" | "enable",
    identityId: string,
    businessId: string | null,
  ) => {
    if (!businessId) {
      toast.error("Business context required");
      return;
    }

    startTransition(async () => {
      try {
        switch (action) {
          case "lock":
            await lockControlCenterSecurityAccountAction(identityId, businessId);
            toast.success("Account locked");
            break;
          case "unlock":
            await unlockControlCenterSecurityAccountAction(identityId, businessId);
            toast.success("Account unlocked");
            break;
          case "disable":
            await disableControlCenterSecurityAccountAction(identityId, businessId);
            toast.success("Account disabled");
            break;
          case "enable":
            await enableControlCenterSecurityAccountAction(identityId, businessId);
            toast.success("Account enabled");
            break;
        }
        refreshBundle();
      } catch (actionError) {
        toast.error(actionError instanceof Error ? actionError.message : "Account action failed");
      }
    });
  };

  const handleRotateApiKey = (apiKeyId: string, businessId: string | null, source: "iam" | "platform") => {
    if (!businessId) {
      toast.error("Business context required");
      return;
    }

    startTransition(async () => {
      try {
        const result = await rotateControlCenterSecurityApiKeyAction(apiKeyId, businessId, source);
        toast.success("API key rotated");
        if (result.rawKey) {
          toast.message(`New key prefix: ${result.keyPrefix ?? "generated"}`);
        }
        refreshBundle();
      } catch (actionError) {
        toast.error(actionError instanceof Error ? actionError.message : "Unable to rotate API key");
      }
    });
  };

  const handleExport = () => {
    startTransition(async () => {
      try {
        const report = await exportControlCenterSecurityReportAction();
        const blob = new Blob([report], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `busal-security-report-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Security report downloaded");
      } catch (exportError) {
        toast.error(exportError instanceof Error ? exportError.message : "Export failed");
      }
    });
  };

  const toggleSession = (sessionId: string) => {
    setSelectedSessionIds((current) =>
      current.includes(sessionId)
        ? current.filter((id) => id !== sessionId)
        : [...current, sessionId],
    );
  };

  if (error) {
    return (
      <ControlCenterErrorState
        title="Unable to load Security Center"
        description={error}
        onRetry={refreshBundle}
      />
    );
  }

  return (
    <PageContainer>
      <SectionHeader
        title="Security Center"
        description="Platform-wide authentication, sessions, MFA, API keys, and security events."
        action={
          <div className="flex gap-2">
            {permissions.canExport ? (
              <Button variant="outline" size="sm" onClick={handleExport} disabled={isPending}>
                <Download className="h-4 w-4" />
                Export report
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={refreshBundle} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PlatformStatCard
          title="Security Health"
          value={`${overview.healthScore}%`}
          icon={overview.healthScore >= 80 ? ShieldCheck : ShieldAlert}
          description="Composite security posture score"
        />
        <PlatformStatCard title="Active Sessions" value={overview.activeSessions} />
        <PlatformStatCard title="Operator Sessions" value={overview.operatorSessions} />
        <PlatformStatCard title="Failed Logins (24h)" value={overview.failedLogins24h} />
        <PlatformStatCard
          title="MFA Coverage"
          value={`${overview.mfaEnrolled}/${overview.mfaEligible}`}
        />
        <PlatformStatCard title="Locked Accounts" value={overview.lockedAccounts} />
        <PlatformStatCard title="Active API Keys" value={overview.activeApiKeys} />
        <PlatformStatCard title="Open Alerts" value={overview.openSecurityAlerts} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Failed logins (24h)</span>
              <span>{overview.failedLogins24h}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Suspicious events (24h)</span>
              <span>{overview.suspiciousEvents24h}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Suspended accounts</span>
              <span>{overview.suspendedAccounts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">MFA required</span>
              <span>{passwordPolicy.mfaRequired ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min password length</span>
              <span>{passwordPolicy.passwordMinLength}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Session timeout</span>
              <span>{passwordPolicy.sessionTimeoutMinutes} min</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Lock Status</CardTitle>
          </CardHeader>
          <CardContent>
            {lockedAccounts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No locked or suspended accounts.</p>
            ) : (
              <div className="space-y-2">
                {lockedAccounts.slice(0, 5).map((account) => (
                  <div key={account.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{account.email ?? account.name}</span>
                    <SecurityStatusBadge label={account.status} variant="danger" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2 xl:col-span-2">
          <Label htmlFor="security-search">Search</Label>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              id="security-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Email, IP, business, device"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="security-event-type">Event type</Label>
          <select
            id="security-event-type"
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All events</option>
            {SECURITY_EVENT_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={operatorOnly}
              onChange={(event) => setOperatorOnly(event.target.checked)}
            />
            Operator sessions only
          </label>
        </div>

        <div className="flex items-end gap-2">
          <Button onClick={() => { loadSessions(); loadEvents(); }} disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply filters"}
          </Button>
        </div>
      </div>

      {permissions.canManageSessions && selectedSessionIds.length > 0 ? (
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <span className="text-muted-foreground text-sm">{selectedSessionIds.length} selected</span>
          <Button variant="outline" size="sm" onClick={() => setConfirmBulkRevoke(true)}>
            Revoke selected
          </Button>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Operator Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.items.length === 0 ? (
              <ControlCenterEmptyState
                title="No active sessions"
                description="No sessions match the current filters."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {permissions.canManageSessions ? <TableHead /> : null}
                      <TableHead>User</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Last activity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.items.map((session: ControlCenterSecuritySessionItem) => (
                      <TableRow key={session.id}>
                        {permissions.canManageSessions ? (
                          <TableCell>
                            <Checkbox
                              checked={selectedSessionIds.includes(session.id)}
                              onChange={() => toggleSession(session.id)}
                              aria-label={`Select session ${session.id}`}
                            />
                          </TableCell>
                        ) : null}
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{session.userEmail ?? "Unknown"}</p>
                            {session.isOperator ? (
                              <SecurityStatusBadge label="Operator" variant="warn" />
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>{session.deviceName ?? session.browser ?? "—"}</TableCell>
                        <TableCell>{session.ipAddress ?? "—"}</TableCell>
                        <TableCell>{formatDate(session.lastActivityAt)}</TableCell>
                        <TableCell className="text-right">
                          {permissions.canManageSessions ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTerminateSession(session.id)}
                              disabled={isPending}
                            >
                              Terminate
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Showing {sessions.items.length} of {sessions.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sessions.page <= 1 || isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await queryControlCenterSecuritySessionsAction({
                        search: search || undefined,
                        operatorOnly,
                        page: sessions.page - 1,
                      });
                      setBundle((current) => ({ ...current, sessions: result }));
                    })
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sessions.page >= sessions.totalPages || isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await queryControlCenterSecuritySessionsAction({
                        search: search || undefined,
                        operatorOnly,
                        page: sessions.page + 1,
                      });
                      setBundle((current) => ({ ...current, sessions: result }));
                    })
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Security Events</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <ControlCenterEmptyState
                title="No security events"
                description="Security audit events will appear here."
              />
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{event.eventType.replace(/_/g, " ")}</p>
                        <p className="text-muted-foreground text-xs">
                          {event.userEmail ?? "System"} · {event.businessName ?? "Platform"}
                        </p>
                      </div>
                      {event.isSuspicious ? (
                        <SecurityStatusBadge label="Suspicious" variant="danger" />
                      ) : null}
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">
                      {formatDate(event.createdAt)} · {event.ipAddress ?? "No IP"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>MFA Status</CardTitle>
          </CardHeader>
          <CardContent>
            {mfaStatus.length === 0 ? (
              <ControlCenterEmptyState
                title="No MFA enrollments"
                description="Verified MFA enrollments will appear here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Methods</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mfaStatus.map((item) => (
                    <TableRow key={item.identityId}>
                      <TableCell>{item.userEmail ?? "—"}</TableCell>
                      <TableCell>{item.mfaTypes.join(", ")}</TableCell>
                      <TableCell>
                        <SecurityStatusBadge
                          label={item.isVerified ? "Verified" : "Pending"}
                          variant={item.isVerified ? "ok" : "warn"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 ? (
              <ControlCenterEmptyState
                title="No API keys"
                description="Active IAM and platform API keys will appear here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={`${key.source}-${key.id}`}>
                      <TableCell>{key.name}</TableCell>
                      <TableCell>{key.keyPrefix}</TableCell>
                      <TableCell>{key.source}</TableCell>
                      <TableCell className="text-right">
                        {permissions.canManageApiKeys && key.businessId ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRotateApiKey(key.id, key.businessId, key.source)}
                            disabled={isPending}
                          >
                            Rotate
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Security Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <ControlCenterEmptyState
                title="No open alerts"
                description="Security alerts from IAM, monitoring, and platform observability."
              />
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={`${alert.source}-${alert.id}`} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {alert.businessName ?? "Platform"} · {alert.source}
                        </p>
                      </div>
                      <SecurityStatusBadge
                        label={alert.severity}
                        variant={alert.severity.includes("HIGH") ? "danger" : "warn"}
                      />
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">{formatDate(alert.triggeredAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {lockedAccounts.length === 0 && events.length === 0 ? (
              <ControlCenterEmptyState
                title="No audit activity"
                description="Account actions and security events appear in the timeline."
              />
            ) : (
              <div className="space-y-3">
                {[...events.slice(0, 8), ...lockedAccounts.slice(0, 4).map((account) => ({
                  id: `account-${account.id}`,
                  eventType: account.status,
                  userEmail: account.email,
                  businessName: account.businessName,
                  createdAt: account.updatedAt,
                  ipAddress: null,
                  isSuspicious: account.status === "LOCKED",
                }))].slice(0, 12).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between border-b pb-2 text-sm">
                    <div>
                      <p className="font-medium">{String(entry.eventType).replace(/_/g, " ")}</p>
                      <p className="text-muted-foreground text-xs">
                        {entry.userEmail ?? "Account"} · {entry.businessName ?? "Platform"}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs">{formatDate(entry.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {permissions.canManageAccounts && lockedAccounts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lockedAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.email ?? account.name}</TableCell>
                    <TableCell>
                      <SecurityStatusBadge label={account.status} variant="danger" />
                    </TableCell>
                    <TableCell>{account.businessName ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {account.status !== "LOCKED" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAccountAction("lock", account.id, account.businessId)}
                            disabled={isPending}
                          >
                            Lock
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAccountAction("unlock", account.id, account.businessId)}
                            disabled={isPending}
                          >
                            Unlock
                          </Button>
                        )}
                        {account.status === "SUSPENDED" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAccountAction("enable", account.id, account.businessId)}
                            disabled={isPending}
                          >
                            Enable
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAccountAction("disable", account.id, account.businessId)}
                            disabled={isPending}
                          >
                            Disable
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <TenantConfirmDialog
        open={confirmBulkRevoke}
        title="Revoke selected sessions"
        description={`Terminate ${selectedSessionIds.length} selected sessions?`}
        confirmLabel="Revoke sessions"
        destructive
        loading={isPending}
        onConfirm={handleBulkRevoke}
        onOpenChange={setConfirmBulkRevoke}
      />
    </PageContainer>
  );
}
