interface BackupPlatformListsProps {
  backups?: Array<{
    id: string;
    backupKey: string;
    triggerType: string;
    scope: string;
    status: string;
    sizeBytes: string;
    verifiedAt: string | null;
    createdAt: string;
  }>;
  jobs?: Array<{
    id: string;
    jobType: string;
    status: string;
    progressPct: number;
    createdAt: string;
    completedAt: string | null;
  }>;
  plans?: Array<{
    id: string;
    name: string;
    description: string;
    rtoMinutes: number;
    rpoMinutes: number;
    isActive: boolean;
  }>;
  policies?: Array<{
    id: string;
    policyKey: string;
    name: string;
    module: string;
    scope: string;
    retentionDays: number;
    isActive: boolean;
  }>;
  retentionPolicies?: Array<{
    id: string;
    name: string;
    retentionDays: number;
    archiveEnabled: boolean;
  }>;
  registrations?: Array<{
    policyKey: string;
    name: string;
    module: string;
    scope: string;
  }>;
  auditLogs?: Array<{
    id: string;
    eventType: string;
    createdAt: string;
  }>;
}

export function BackupPlatformLists({
  backups = [],
  jobs = [],
  plans = [],
  policies = [],
  retentionPolicies = [],
  registrations = [],
  auditLogs = [],
}: BackupPlatformListsProps) {
  return (
    <div className="space-y-8">
      {backups.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Backup Records</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Scope</th>
                  <th className="px-4 py-2 text-left">Trigger</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Size</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id} className="border-t">
                    <td className="px-4 py-2">{backup.backupKey}</td>
                    <td className="px-4 py-2">{backup.scope}</td>
                    <td className="px-4 py-2">{backup.triggerType}</td>
                    <td className="px-4 py-2">{backup.status}</td>
                    <td className="px-4 py-2">{backup.sizeBytes}</td>
                    <td className="px-4 py-2">{backup.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {jobs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Recovery Jobs</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Progress</th>
                  <th className="px-4 py-2 text-left">Created</th>
                  <th className="px-4 py-2 text-left">Completed</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-t">
                    <td className="px-4 py-2">{job.jobType}</td>
                    <td className="px-4 py-2">{job.status}</td>
                    <td className="px-4 py-2">{job.progressPct}%</td>
                    <td className="px-4 py-2">{job.createdAt}</td>
                    <td className="px-4 py-2">{job.completedAt ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {plans.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Disaster Recovery Plans</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">RTO</th>
                  <th className="px-4 py-2 text-left">RPO</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-t">
                    <td className="px-4 py-2">{plan.name}</td>
                    <td className="px-4 py-2">{plan.rtoMinutes}m</td>
                    <td className="px-4 py-2">{plan.rpoMinutes}m</td>
                    <td className="px-4 py-2">{plan.isActive ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {policies.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Backup Policies</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Scope</th>
                  <th className="px-4 py-2 text-left">Retention</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy) => (
                  <tr key={policy.id} className="border-t">
                    <td className="px-4 py-2">{policy.policyKey}</td>
                    <td className="px-4 py-2">{policy.module}</td>
                    <td className="px-4 py-2">{policy.scope}</td>
                    <td className="px-4 py-2">{policy.retentionDays}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {retentionPolicies.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Retention Policies</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Retention</th>
                  <th className="px-4 py-2 text-left">Archive</th>
                </tr>
              </thead>
              <tbody>
                {retentionPolicies.map((policy) => (
                  <tr key={policy.id} className="border-t">
                    <td className="px-4 py-2">{policy.name}</td>
                    <td className="px-4 py-2">{policy.retentionDays}d</td>
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
          <h2 className="text-lg font-medium">Policy Registry</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Scope</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((entry) => (
                  <tr key={entry.policyKey} className="border-t">
                    <td className="px-4 py-2">{entry.policyKey}</td>
                    <td className="px-4 py-2">{entry.name}</td>
                    <td className="px-4 py-2">{entry.module}</td>
                    <td className="px-4 py-2">{entry.scope}</td>
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
