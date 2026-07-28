import { formatMaintenanceLabel } from "@/modules/tenant-platform/engine/maintenance-engine";
import type { TenantMaintenanceMode } from "@prisma/client";

interface TenantPlatformListsProps {
  tenant?: {
    id: string;
    businessId: string;
    lifecycleStatus: string;
    healthStatus: string;
    subscriptionPlan: string | null;
    subscriptionStatus: string;
    maintenanceMode: TenantMaintenanceMode;
    scheduledMaintenanceAt: string | null;
    branchCount: number;
    suspendedAt: string | null;
    archivedAt: string | null;
  };
  settings?: {
    displayName: string | null;
    supportEmail: string | null;
    billingEmail: string | null;
    defaultTimezone: string;
    defaultLocale: string;
    complianceMode: string;
  };
  limits?: {
    maxUsers: number;
    maxBranches: number;
    maxStorageBytes: string;
    maxApiCallsPerMonth: number;
    maxAiTokensPerMonth: number;
    maxDatabaseRows: number;
    maxMarketplaceLicenses: number;
  };
  usage?: {
    activeUsers: number;
    storageUsedBytes: string;
    apiCallsThisMonth: number;
    aiTokensThisMonth: number;
    databaseRows: number;
    marketplaceLicenses: number;
    fileCount: number;
    workflowCount: number;
    loginActivityCount: number;
    moduleUsage: Record<string, number>;
    lastCalculatedAt: string;
  };
  policies?: Array<{
    id: string;
    policyKey: string;
    name: string;
    module: string;
    isActive: boolean;
  }>;
  health?: {
    healthStatus: string;
    lifecycleStatus: string;
    maintenanceMode: TenantMaintenanceMode;
    scheduledMaintenanceAt: string | null;
    checks: Array<{ name: string; status: string; message: string }>;
  };
  analytics?: {
    activeUsers: number;
    storageUsagePct: number;
    apiUsagePct: number;
    aiConsumptionPct: number;
    loginActivityCount: number;
    fileCount: number;
    workflowCount: number;
    moduleUsage: Record<string, number>;
    subscriptionStatus: string;
    healthStatus: string;
  };
  activities?: Array<{
    id: string;
    eventType: string;
    title: string;
    description: string | null;
    createdAt: string;
  }>;
  impersonations?: Array<{
    id: string;
    adminUserId: string;
    targetUserId: string | null;
    reason: string;
    isActive: boolean;
    startedAt: string;
  }>;
  registrations?: Array<{ policyKey: string; name: string; module: string }>;
  auditLogs?: Array<{ id: string; eventType: string; createdAt: string }>;
}

export function TenantPlatformLists({
  tenant,
  settings,
  limits,
  usage,
  policies = [],
  health,
  analytics,
  activities = [],
  impersonations = [],
  registrations = [],
  auditLogs = [],
}: TenantPlatformListsProps) {
  return (
    <div className="space-y-8">
      {tenant ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Tenant Lifecycle</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Status</p>
              <p className="text-lg font-medium">{tenant.lifecycleStatus}</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Health</p>
              <p className="text-lg font-medium">{tenant.healthStatus}</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Subscription</p>
              <p className="text-lg font-medium">{tenant.subscriptionPlan ?? "None"}</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Maintenance</p>
              <p className="text-lg font-medium">
                {formatMaintenanceLabel(tenant.maintenanceMode)}
              </p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Branches</p>
              <p className="text-lg font-medium">{tenant.branchCount}</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Suspended At</p>
              <p className="text-lg font-medium">{tenant.suspendedAt ?? "—"}</p>
            </div>
          </div>
        </section>
      ) : null}

      {settings ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Business Profile</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Display Name</p>
              <p className="text-lg font-medium">{settings.displayName ?? "—"}</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Support Email</p>
              <p className="text-lg font-medium">{settings.supportEmail ?? "—"}</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Compliance</p>
              <p className="text-lg font-medium">{settings.complianceMode}</p>
            </div>
          </div>
        </section>
      ) : null}

      {limits && usage ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Resource Management</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Resource</th>
                  <th className="px-4 py-2 text-left">Used</th>
                  <th className="px-4 py-2 text-left">Limit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2">Users</td>
                  <td className="px-4 py-2">{usage.activeUsers}</td>
                  <td className="px-4 py-2">{limits.maxUsers}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">API Calls</td>
                  <td className="px-4 py-2">{usage.apiCallsThisMonth}</td>
                  <td className="px-4 py-2">{limits.maxApiCallsPerMonth}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">AI Tokens</td>
                  <td className="px-4 py-2">{usage.aiTokensThisMonth}</td>
                  <td className="px-4 py-2">{limits.maxAiTokensPerMonth}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">Storage (bytes)</td>
                  <td className="px-4 py-2">{usage.storageUsedBytes}</td>
                  <td className="px-4 py-2">{limits.maxStorageBytes}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">Database Rows</td>
                  <td className="px-4 py-2">{usage.databaseRows}</td>
                  <td className="px-4 py-2">{limits.maxDatabaseRows}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">Files</td>
                  <td className="px-4 py-2">{usage.fileCount}</td>
                  <td className="px-4 py-2">—</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">Workflows</td>
                  <td className="px-4 py-2">{usage.workflowCount}</td>
                  <td className="px-4 py-2">—</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">Marketplace Licenses</td>
                  <td className="px-4 py-2">{usage.marketplaceLicenses}</td>
                  <td className="px-4 py-2">{limits.maxMarketplaceLicenses}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {health ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Tenant Health</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Check</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Message</th>
                </tr>
              </thead>
              <tbody>
                {health.checks.map((check) => (
                  <tr key={check.name} className="border-t">
                    <td className="px-4 py-2">{check.name}</td>
                    <td className="px-4 py-2">{check.status}</td>
                    <td className="px-4 py-2">{check.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {analytics ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Analytics</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Active Users</p>
              <p className="text-lg font-medium">{analytics.activeUsers}</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Storage Usage</p>
              <p className="text-lg font-medium">{analytics.storageUsagePct}%</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">API Usage</p>
              <p className="text-lg font-medium">{analytics.apiUsagePct}%</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">AI Consumption</p>
              <p className="text-lg font-medium">{analytics.aiConsumptionPct}%</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Login Activity</p>
              <p className="text-lg font-medium">{analytics.loginActivityCount}</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Files</p>
              <p className="text-lg font-medium">{analytics.fileCount}</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Workflows</p>
              <p className="text-lg font-medium">{analytics.workflowCount}</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Subscription</p>
              <p className="text-lg font-medium">{analytics.subscriptionStatus}</p>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">Health</p>
              <p className="text-lg font-medium">{analytics.healthStatus}</p>
            </div>
          </div>
        </section>
      ) : null}

      {policies.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Tenant Policies</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Active</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy) => (
                  <tr key={policy.id} className="border-t">
                    <td className="px-4 py-2">{policy.policyKey}</td>
                    <td className="px-4 py-2">{policy.name}</td>
                    <td className="px-4 py-2">{policy.module}</td>
                    <td className="px-4 py-2">{policy.isActive ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activities.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Activity Timeline</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Event</th>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id} className="border-t">
                    <td className="px-4 py-2">{activity.eventType}</td>
                    <td className="px-4 py-2">{activity.title}</td>
                    <td className="px-4 py-2">{activity.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {impersonations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Impersonation Sessions</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Admin</th>
                  <th className="px-4 py-2 text-left">Target</th>
                  <th className="px-4 py-2 text-left">Reason</th>
                  <th className="px-4 py-2 text-left">Active</th>
                </tr>
              </thead>
              <tbody>
                {impersonations.map((session) => (
                  <tr key={session.id} className="border-t">
                    <td className="px-4 py-2">{session.adminUserId}</td>
                    <td className="px-4 py-2">{session.targetUserId ?? "—"}</td>
                    <td className="px-4 py-2">{session.reason}</td>
                    <td className="px-4 py-2">{session.isActive ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {registrations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Policy Registry</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Module</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((entry) => (
                  <tr key={entry.policyKey} className="border-t">
                    <td className="px-4 py-2">{entry.policyKey}</td>
                    <td className="px-4 py-2">{entry.name}</td>
                    <td className="px-4 py-2">{entry.module}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {auditLogs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Audit Logs</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Event</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-2">{log.eventType}</td>
                    <td className="px-4 py-2">{log.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
