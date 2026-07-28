interface FeatureFlagsListsProps {
  flags?: Array<{
    id: string;
    key: string;
    name: string;
    module: string;
    flagType: string;
    status: string;
    defaultEnabled: boolean;
    rolloutPercentage: number;
  }>;
  targets?: Array<{
    id: string;
    targetType: string;
    targetValue: string;
    isIncluded: boolean;
    priority: number;
  }>;
  evaluations?: Array<{
    id: string;
    flagKey: string;
    enabled: boolean;
    createdAt: string;
  }>;
  versions?: Array<{
    id: string;
    flagId: string;
    version: number;
    changeReason: string | null;
    createdAt: string;
  }>;
  registrations?: Array<{
    key: string;
    module: string;
    name: string;
    flagType: string;
  }>;
  auditLogs?: Array<{
    id: string;
    eventType: string;
    flagKey: string | null;
    createdAt: string;
  }>;
}

export function FeatureFlagsLists({
  flags = [],
  targets = [],
  evaluations = [],
  versions = [],
  registrations = [],
  auditLogs = [],
}: FeatureFlagsListsProps) {
  return (
    <div className="space-y-8">
      {flags.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Feature Flags</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Rollout</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((flag) => (
                  <tr key={flag.id} className="border-t">
                    <td className="px-4 py-2">{flag.key}</td>
                    <td className="px-4 py-2">{flag.module}</td>
                    <td className="px-4 py-2">{flag.flagType}</td>
                    <td className="px-4 py-2">{flag.status}</td>
                    <td className="px-4 py-2">{flag.rolloutPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {targets.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Targeting Rules</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Value</th>
                  <th className="px-4 py-2 text-left">Included</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((target) => (
                  <tr key={target.id} className="border-t">
                    <td className="px-4 py-2">{target.targetType}</td>
                    <td className="px-4 py-2">{target.targetValue}</td>
                    <td className="px-4 py-2">{target.isIncluded ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {evaluations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Evaluation History</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Flag</th>
                  <th className="px-4 py-2 text-left">Enabled</th>
                  <th className="px-4 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="border-t">
                    <td className="px-4 py-2">{evaluation.flagKey}</td>
                    <td className="px-4 py-2">{evaluation.enabled ? "Yes" : "No"}</td>
                    <td className="px-4 py-2">{evaluation.createdAt}</td>
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
                  <th className="px-4 py-2 text-left">Flag</th>
                  <th className="px-4 py-2 text-left">Version</th>
                  <th className="px-4 py-2 text-left">Reason</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr key={version.id} className="border-t">
                    <td className="px-4 py-2">{version.flagId}</td>
                    <td className="px-4 py-2">v{version.version}</td>
                    <td className="px-4 py-2">{version.changeReason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {registrations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Feature Registry</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Type</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => (
                  <tr key={registration.key} className="border-t">
                    <td className="px-4 py-2">{registration.key}</td>
                    <td className="px-4 py-2">{registration.module}</td>
                    <td className="px-4 py-2">{registration.flagType}</td>
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
                  <th className="px-4 py-2 text-left">Flag</th>
                  <th className="px-4 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-2">{log.eventType}</td>
                    <td className="px-4 py-2">{log.flagKey ?? "—"}</td>
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
