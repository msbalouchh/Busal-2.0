interface NotificationsListsProps {
  inbox?: Array<{
    id: string;
    title: string;
    body: string;
    category: string;
    status: string;
    createdAt: string;
  }>;
  templates?: Array<{
    id: string;
    slug: string;
    name: string;
    templateType: string;
    category: string;
    version: number;
    isActive: boolean;
  }>;
  rules?: Array<{
    id: string;
    name: string;
    mode: string;
    priority: string;
    category: string | null;
    channel: string | null;
    isActive: boolean;
  }>;
  channels?: Array<{
    id: string;
    channel: string;
    name: string;
    isEnabled: boolean;
  }>;
  deliveries?: Array<{
    id: string;
    channel: string;
    status: string;
    queuedAt: string;
    deliveredAt: string | null;
    retryCount: number;
  }>;
  preference?: {
    enabledChannels: string[];
    language: string;
    digestFrequency: string;
    disabledCategories: string[];
  };
  auditLogs?: Array<{
    id: string;
    eventType: string;
    channel: string | null;
    createdAt: string;
  }>;
}

export function NotificationsLists({
  inbox = [],
  templates = [],
  rules = [],
  channels = [],
  deliveries = [],
  preference,
  auditLogs = [],
}: NotificationsListsProps) {
  return (
    <div className="space-y-8">
      {inbox.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Inbox</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Received</th>
                </tr>
              </thead>
              <tbody>
                {inbox.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">{item.title}</td>
                    <td className="px-4 py-2">{item.category}</td>
                    <td className="px-4 py-2">{item.status}</td>
                    <td className="px-4 py-2">{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {templates.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Templates</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Version</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id} className="border-t">
                    <td className="px-4 py-2">{template.name}</td>
                    <td className="px-4 py-2">{template.templateType}</td>
                    <td className="px-4 py-2">{template.category}</td>
                    <td className="px-4 py-2">v{template.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {rules.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Delivery Rules</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Mode</th>
                  <th className="px-4 py-2 text-left">Priority</th>
                  <th className="px-4 py-2 text-left">Active</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-t">
                    <td className="px-4 py-2">{rule.name}</td>
                    <td className="px-4 py-2">{rule.mode}</td>
                    <td className="px-4 py-2">{rule.priority}</td>
                    <td className="px-4 py-2">{rule.isActive ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {channels.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Channels</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Channel</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel) => (
                  <tr key={channel.id} className="border-t">
                    <td className="px-4 py-2">{channel.channel}</td>
                    <td className="px-4 py-2">{channel.name}</td>
                    <td className="px-4 py-2">{channel.isEnabled ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {deliveries.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Deliveries</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Channel</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Queued</th>
                  <th className="px-4 py-2 text-left">Retries</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="border-t">
                    <td className="px-4 py-2">{delivery.channel}</td>
                    <td className="px-4 py-2">{delivery.status}</td>
                    <td className="px-4 py-2">{new Date(delivery.queuedAt).toLocaleString()}</td>
                    <td className="px-4 py-2">{delivery.retryCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {preference ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Your Preferences</h2>
          <div className="bg-card rounded-xl border p-4 text-sm">
            <p>Language: {preference.language}</p>
            <p>Digest: {preference.digestFrequency}</p>
            <p>Channels: {preference.enabledChannels.join(", ")}</p>
            <p>
              Disabled categories:{" "}
              {preference.disabledCategories.length > 0
                ? preference.disabledCategories.join(", ")
                : "None"}
            </p>
          </div>
        </section>
      ) : null}

      {auditLogs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Audit Log</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Event</th>
                  <th className="px-4 py-2 text-left">Channel</th>
                  <th className="px-4 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-2">{log.eventType}</td>
                    <td className="px-4 py-2">{log.channel ?? "—"}</td>
                    <td className="px-4 py-2">{new Date(log.createdAt).toLocaleString()}</td>
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
