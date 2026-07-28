interface SettingsEngineListsProps {
  definitions?: Array<{
    key: string;
    module: string;
    category: string;
    valueType: string;
    isRequired: boolean;
    helpText: string | null;
  }>;
  values?: Array<{
    id: string;
    definitionKey: string;
    scope: string;
    environment: string;
    scopeIdentifier: string;
    value: unknown;
    currentVersion: number;
    isDeleted: boolean;
  }>;
  versions?: Array<{
    id: string;
    settingValueId: string;
    version: number;
    changeReason: string | null;
    createdAt: string;
  }>;
  auditLogs?: Array<{
    id: string;
    eventType: string;
    definitionKey: string | null;
    createdAt: string;
  }>;
  registrations?: Array<{
    key: string;
    module: string;
    category: string;
    valueType: string;
    helpText?: string;
  }>;
}

export function SettingsEngineLists({
  definitions = [],
  values = [],
  versions = [],
  auditLogs = [],
  registrations = [],
}: SettingsEngineListsProps) {
  return (
    <div className="space-y-8">
      {definitions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Setting Definitions</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Type</th>
                </tr>
              </thead>
              <tbody>
                {definitions.map((definition) => (
                  <tr key={definition.key} className="border-t">
                    <td className="px-4 py-2">{definition.key}</td>
                    <td className="px-4 py-2">{definition.module}</td>
                    <td className="px-4 py-2">{definition.category}</td>
                    <td className="px-4 py-2">{definition.valueType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {values.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Configuration Values</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Scope</th>
                  <th className="px-4 py-2 text-left">Environment</th>
                  <th className="px-4 py-2 text-left">Version</th>
                </tr>
              </thead>
              <tbody>
                {values.map((value) => (
                  <tr key={value.id} className="border-t">
                    <td className="px-4 py-2">{value.definitionKey}</td>
                    <td className="px-4 py-2">{value.scope}</td>
                    <td className="px-4 py-2">{value.environment}</td>
                    <td className="px-4 py-2">v{value.currentVersion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {versions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Version History</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Setting</th>
                  <th className="px-4 py-2 text-left">Version</th>
                  <th className="px-4 py-2 text-left">Reason</th>
                  <th className="px-4 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr key={version.id} className="border-t">
                    <td className="px-4 py-2">{version.settingValueId}</td>
                    <td className="px-4 py-2">v{version.version}</td>
                    <td className="px-4 py-2">{version.changeReason ?? "—"}</td>
                    <td className="px-4 py-2">{version.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {registrations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Registered Settings</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Category</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => (
                  <tr key={registration.key} className="border-t">
                    <td className="px-4 py-2">{registration.key}</td>
                    <td className="px-4 py-2">{registration.module}</td>
                    <td className="px-4 py-2">{registration.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-2">{log.eventType}</td>
                    <td className="px-4 py-2">{log.definitionKey ?? "—"}</td>
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
