interface IamListsProps {
  identities?: Array<{
    id: string;
    name: string;
    email: string | null;
    identityType: string;
    status: string;
    createdAt: string;
  }>;
  sessions?: Array<{
    id: string;
    deviceName: string | null;
    browser: string | null;
    ipAddress: string | null;
    country: string | null;
    loginAt: string;
    lastActivityAt: string;
    isActive: boolean;
  }>;
  apiKeys?: Array<{
    id: string;
    name: string;
    keyType: string;
    keyPrefix: string;
    permissions: string[];
    usageCount: number;
    lastUsedAt: string | null;
  }>;
  serviceAccounts?: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    permissions: string[];
    isActive: boolean;
    usageCount: number;
  }>;
  policies?: Array<{
    id: string;
    name: string;
    scope: string;
    roleSlug: string | null;
    isActive: boolean;
  }>;
  providers?: Array<{
    id: string;
    name: string;
    providerType: string;
    isEnabled: boolean;
  }>;
  auditLogs?: Array<{
    id: string;
    eventType: string;
    ipAddress: string | null;
    createdAt: string;
  }>;
}

export function IamLists({
  identities = [],
  sessions = [],
  apiKeys = [],
  serviceAccounts = [],
  policies = [],
  providers = [],
  auditLogs = [],
}: IamListsProps) {
  return (
    <div className="space-y-8">
      {identities.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Identities</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Email</th>
                </tr>
              </thead>
              <tbody>
                {identities.map((identity) => (
                  <tr key={identity.id} className="border-t">
                    <td className="px-4 py-2">{identity.name}</td>
                    <td className="px-4 py-2">{identity.identityType}</td>
                    <td className="px-4 py-2">{identity.status}</td>
                    <td className="px-4 py-2">{identity.email ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {sessions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Active Sessions</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Device</th>
                  <th className="px-4 py-2 text-left">Browser</th>
                  <th className="px-4 py-2 text-left">IP</th>
                  <th className="px-4 py-2 text-left">Country</th>
                  <th className="px-4 py-2 text-left">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-t">
                    <td className="px-4 py-2">{session.deviceName ?? "Unknown"}</td>
                    <td className="px-4 py-2">{session.browser ?? "—"}</td>
                    <td className="px-4 py-2">{session.ipAddress ?? "—"}</td>
                    <td className="px-4 py-2">{session.country ?? "—"}</td>
                    <td className="px-4 py-2">
                      {new Date(session.lastActivityAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {apiKeys.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">API Keys</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Prefix</th>
                  <th className="px-4 py-2 text-left">Usage</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="border-t">
                    <td className="px-4 py-2">{apiKey.name}</td>
                    <td className="px-4 py-2">{apiKey.keyType}</td>
                    <td className="px-4 py-2">{apiKey.keyPrefix}</td>
                    <td className="px-4 py-2">{apiKey.usageCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {serviceAccounts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Service Accounts</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {serviceAccounts.map((account) => (
              <div key={account.id} className="bg-card rounded-xl border p-4 shadow-sm">
                <p className="font-medium">{account.name}</p>
                <p className="text-muted-foreground text-sm">{account.slug}</p>
                <p className="text-muted-foreground mt-2 text-xs">
                  Permissions: {account.permissions.join(", ") || "None"}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {policies.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Access Policies</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {policies.map((policy) => (
              <div key={policy.id} className="bg-card rounded-xl border p-4 shadow-sm">
                <p className="font-medium">{policy.name}</p>
                <p className="text-muted-foreground text-sm">
                  {policy.scope}
                  {policy.roleSlug ? ` · ${policy.roleSlug}` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {providers.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Identity Providers</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {providers.map((provider) => (
              <div key={provider.id} className="bg-card rounded-xl border p-4 shadow-sm">
                <p className="font-medium">{provider.name}</p>
                <p className="text-muted-foreground text-sm">{provider.providerType}</p>
                <p className="mt-2 text-xs">{provider.isEnabled ? "Enabled" : "Disabled"}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {auditLogs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Security Audit Log</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Event</th>
                  <th className="px-4 py-2 text-left">IP</th>
                  <th className="px-4 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-2">{log.eventType}</td>
                    <td className="px-4 py-2">{log.ipAddress ?? "—"}</td>
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
