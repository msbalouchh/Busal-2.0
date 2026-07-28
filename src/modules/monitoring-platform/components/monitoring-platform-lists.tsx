interface MonitoringPlatformListsProps {
  checks?: Array<{
    id: string;
    checkKey: string;
    name: string;
    targetType: string;
    serviceTarget: string;
    status: string;
    lastCheckedAt: string | null;
    isActive: boolean;
  }>;
  snapshots?: Array<{
    id: string;
    snapshotKey: string;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkUsage: number;
    databaseConnections: number;
    activeSessions: number;
    queueLength: number;
    backgroundJobs: number;
    capturedAt: string;
  }>;
  performance?: Array<{
    id: string;
    category: string;
    operationKey: string;
    durationMs: number;
    isSlow: boolean;
    createdAt: string;
  }>;
  errors?: Array<{
    id: string;
    errorType: string;
    message: string;
    correlationId: string | null;
    requestId: string | null;
    createdAt: string;
  }>;
  logs?: Array<{
    id: string;
    level: string;
    message: string;
    source: string;
    correlationId: string | null;
    createdAt: string;
  }>;
  alerts?: Array<{
    id: string;
    alertType: string;
    title: string;
    message: string;
    status: string;
    channels: string[];
    triggeredAt: string;
  }>;
  policies?: Array<{
    id: string;
    name: string;
    logRetentionDays: number;
    metricsRetentionDays: number;
    alertHistoryDays: number;
    archiveEnabled: boolean;
  }>;
  registrations?: Array<{
    checkKey: string;
    name: string;
    targetType: string;
    serviceTarget: string;
  }>;
  auditLogs?: Array<{
    id: string;
    eventType: string;
    createdAt: string;
  }>;
}

export function MonitoringPlatformLists({
  checks = [],
  snapshots = [],
  performance = [],
  errors = [],
  logs = [],
  alerts = [],
  policies = [],
  registrations = [],
  auditLogs = [],
}: MonitoringPlatformListsProps) {
  return (
    <div className="space-y-8">
      {checks.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Health Checks</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Target</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((check) => (
                  <tr key={check.id} className="border-t">
                    <td className="px-4 py-2">{check.checkKey}</td>
                    <td className="px-4 py-2">{check.name}</td>
                    <td className="px-4 py-2">{check.targetType}</td>
                    <td className="px-4 py-2">{check.serviceTarget}</td>
                    <td className="px-4 py-2">{check.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {snapshots.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Metric Snapshots</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">CPU</th>
                  <th className="px-4 py-2 text-left">Memory</th>
                  <th className="px-4 py-2 text-left">Queue</th>
                  <th className="px-4 py-2 text-left">Captured</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((snapshot) => (
                  <tr key={snapshot.id} className="border-t">
                    <td className="px-4 py-2">{snapshot.snapshotKey}</td>
                    <td className="px-4 py-2">{snapshot.cpuUsage.toFixed(1)}%</td>
                    <td className="px-4 py-2">{snapshot.memoryUsage.toFixed(1)}%</td>
                    <td className="px-4 py-2">{snapshot.queueLength}</td>
                    <td className="px-4 py-2">{snapshot.capturedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {performance.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Performance Logs</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Operation</th>
                  <th className="px-4 py-2 text-left">Duration</th>
                  <th className="px-4 py-2 text-left">Slow</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-2">{log.category}</td>
                    <td className="px-4 py-2">{log.operationKey}</td>
                    <td className="px-4 py-2">{log.durationMs}ms</td>
                    <td className="px-4 py-2">{log.isSlow ? "Yes" : "No"}</td>
                    <td className="px-4 py-2">{log.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {errors.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Error Logs</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Message</th>
                  <th className="px-4 py-2 text-left">Correlation</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((error) => (
                  <tr key={error.id} className="border-t">
                    <td className="px-4 py-2">{error.errorType}</td>
                    <td className="px-4 py-2">{error.message}</td>
                    <td className="px-4 py-2">{error.correlationId ?? "—"}</td>
                    <td className="px-4 py-2">{error.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {logs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Structured Logs</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Level</th>
                  <th className="px-4 py-2 text-left">Source</th>
                  <th className="px-4 py-2 text-left">Message</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-2">{log.level}</td>
                    <td className="px-4 py-2">{log.source}</td>
                    <td className="px-4 py-2">{log.message}</td>
                    <td className="px-4 py-2">{log.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {alerts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Alerts</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Channels</th>
                  <th className="px-4 py-2 text-left">Triggered</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id} className="border-t">
                    <td className="px-4 py-2">{alert.alertType}</td>
                    <td className="px-4 py-2">{alert.title}</td>
                    <td className="px-4 py-2">{alert.status}</td>
                    <td className="px-4 py-2">{alert.channels.join(", ")}</td>
                    <td className="px-4 py-2">{alert.triggeredAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {policies.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Retention Policies</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Logs</th>
                  <th className="px-4 py-2 text-left">Metrics</th>
                  <th className="px-4 py-2 text-left">Alerts</th>
                  <th className="px-4 py-2 text-left">Archive</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy) => (
                  <tr key={policy.id} className="border-t">
                    <td className="px-4 py-2">{policy.name}</td>
                    <td className="px-4 py-2">{policy.logRetentionDays}d</td>
                    <td className="px-4 py-2">{policy.metricsRetentionDays}d</td>
                    <td className="px-4 py-2">{policy.alertHistoryDays}d</td>
                    <td className="px-4 py-2">{policy.archiveEnabled ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {registrations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Health Check Registry</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Target</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((entry) => (
                  <tr key={entry.checkKey} className="border-t">
                    <td className="px-4 py-2">{entry.checkKey}</td>
                    <td className="px-4 py-2">{entry.name}</td>
                    <td className="px-4 py-2">{entry.targetType}</td>
                    <td className="px-4 py-2">{entry.serviceTarget}</td>
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
