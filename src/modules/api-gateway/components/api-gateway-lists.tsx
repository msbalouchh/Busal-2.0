interface ApiGatewayListsProps {
  routes?: Array<{
    id: string;
    routeKey: string;
    path: string;
    method: string;
    routeType: string;
    serviceTarget: string;
    version: string;
    isActive: boolean;
  }>;
  policies?: Array<{
    id: string;
    name: string;
    scope: string;
    scopeIdentifier: string;
    requestsPerMinute: number;
    burstLimit: number;
  }>;
  logs?: Array<{
    id: string;
    method: string;
    path: string;
    statusCode: number;
    responseTimeMs: number;
    createdAt: string;
  }>;
  registrations?: Array<{
    routeKey: string;
    path: string;
    method: string;
    routeType: string;
    serviceTarget: string;
  }>;
  webhooks?: Array<{
    id: string;
    name: string;
    url: string;
    events: string[];
    isActive: boolean;
  }>;
  deliveries?: Array<{
    id: string;
    eventType: string;
    status: string;
    attemptCount: number;
    createdAt: string;
  }>;
  openapi?: Array<{
    routeKey: string;
    path: string;
    method: string;
    version: string;
    routeType: string;
    serviceTarget: string;
  }>;
  auditLogs?: Array<{
    id: string;
    eventType: string;
    routeKey: string | null;
    createdAt: string;
  }>;
}

export function ApiGatewayLists({
  routes = [],
  policies = [],
  logs = [],
  registrations = [],
  webhooks = [],
  deliveries = [],
  openapi = [],
  auditLogs = [],
}: ApiGatewayListsProps) {
  return (
    <div className="space-y-8">
      {routes.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">API Routes</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Method</th>
                  <th className="px-4 py-2 text-left">Path</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Target</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route.id} className="border-t">
                    <td className="px-4 py-2">{route.routeKey}</td>
                    <td className="px-4 py-2">{route.method}</td>
                    <td className="px-4 py-2">{route.path}</td>
                    <td className="px-4 py-2">{route.routeType}</td>
                    <td className="px-4 py-2">{route.serviceTarget}</td>
                    <td className="px-4 py-2">{route.isActive ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {policies.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Rate Limit Policies</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Scope</th>
                  <th className="px-4 py-2 text-left">Identifier</th>
                  <th className="px-4 py-2 text-left">RPM</th>
                  <th className="px-4 py-2 text-left">Burst</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy) => (
                  <tr key={policy.id} className="border-t">
                    <td className="px-4 py-2">{policy.name}</td>
                    <td className="px-4 py-2">{policy.scope}</td>
                    <td className="px-4 py-2">{policy.scopeIdentifier}</td>
                    <td className="px-4 py-2">{policy.requestsPerMinute}</td>
                    <td className="px-4 py-2">{policy.burstLimit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {logs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Request Logs</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Method</th>
                  <th className="px-4 py-2 text-left">Path</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Time (ms)</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-2">{log.method}</td>
                    <td className="px-4 py-2">{log.path}</td>
                    <td className="px-4 py-2">{log.statusCode}</td>
                    <td className="px-4 py-2">{log.responseTimeMs}</td>
                    <td className="px-4 py-2">{log.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {registrations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Route Registry</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Method</th>
                  <th className="px-4 py-2 text-left">Path</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Target</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((entry) => (
                  <tr key={entry.routeKey} className="border-t">
                    <td className="px-4 py-2">{entry.routeKey}</td>
                    <td className="px-4 py-2">{entry.method}</td>
                    <td className="px-4 py-2">{entry.path}</td>
                    <td className="px-4 py-2">{entry.routeType}</td>
                    <td className="px-4 py-2">{entry.serviceTarget}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {webhooks.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Webhook Registrations</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">URL</th>
                  <th className="px-4 py-2 text-left">Events</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((webhook) => (
                  <tr key={webhook.id} className="border-t">
                    <td className="px-4 py-2">{webhook.name}</td>
                    <td className="px-4 py-2">{webhook.url}</td>
                    <td className="px-4 py-2">{webhook.events.join(", ")}</td>
                    <td className="px-4 py-2">{webhook.isActive ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {deliveries.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Webhook Deliveries</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Event</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Attempts</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="border-t">
                    <td className="px-4 py-2">{delivery.eventType}</td>
                    <td className="px-4 py-2">{delivery.status}</td>
                    <td className="px-4 py-2">{delivery.attemptCount}</td>
                    <td className="px-4 py-2">{delivery.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {openapi.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">OpenAPI Registry</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Version</th>
                  <th className="px-4 py-2 text-left">Method</th>
                  <th className="px-4 py-2 text-left">Path</th>
                  <th className="px-4 py-2 text-left">Type</th>
                </tr>
              </thead>
              <tbody>
                {openapi.map((entry) => (
                  <tr key={entry.routeKey} className="border-t">
                    <td className="px-4 py-2">{entry.routeKey}</td>
                    <td className="px-4 py-2">{entry.version}</td>
                    <td className="px-4 py-2">{entry.method}</td>
                    <td className="px-4 py-2">{entry.path}</td>
                    <td className="px-4 py-2">{entry.routeType}</td>
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
                  <th className="px-4 py-2 text-left">Route</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-2">{log.eventType}</td>
                    <td className="px-4 py-2">{log.routeKey ?? "—"}</td>
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
