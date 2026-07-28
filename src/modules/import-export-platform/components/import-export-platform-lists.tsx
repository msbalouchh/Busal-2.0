interface ImportExportPlatformListsProps {
  schemas?: Array<{
    id: string;
    schemaKey: string;
    module: string;
    name: string;
    fieldCount: number;
    isActive: boolean;
  }>;
  templates?: Array<{
    id: string;
    name: string;
    schemaKey: string;
    format: string;
    isDefault: boolean;
  }>;
  importJobs?: Array<{
    id: string;
    format: string;
    status: string;
    module: string;
    progressPct: number;
    successCount: number;
    failureCount: number;
    duplicateCount: number;
    createdAt: string;
  }>;
  exportJobs?: Array<{
    id: string;
    format: string;
    status: string;
    module: string;
    progressPct: number;
    successCount: number;
    createdAt: string;
  }>;
  schedules?: Array<{
    id: string;
    name: string;
    jobType: string;
    format: string;
    module: string;
    frequency: string;
    isActive: boolean;
    nextRunAt: string | null;
  }>;
  history?: Array<{
    id: string;
    jobType: string;
    format: string;
    status: string;
    module: string;
    source: string;
    progressPct: number;
    createdAt: string;
  }>;
  registrations?: Array<{
    schemaKey: string;
    module: string;
    name: string;
  }>;
  auditLogs?: Array<{
    id: string;
    eventType: string;
    createdAt: string;
  }>;
}

export function ImportExportPlatformLists({
  schemas = [],
  templates = [],
  importJobs = [],
  exportJobs = [],
  schedules = [],
  history = [],
  registrations = [],
  auditLogs = [],
}: ImportExportPlatformListsProps) {
  return (
    <div className="space-y-8">
      {schemas.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Schemas</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Fields</th>
                </tr>
              </thead>
              <tbody>
                {schemas.map((schema) => (
                  <tr key={schema.id} className="border-t">
                    <td className="px-4 py-2">{schema.schemaKey}</td>
                    <td className="px-4 py-2">{schema.module}</td>
                    <td className="px-4 py-2">{schema.name}</td>
                    <td className="px-4 py-2">{schema.fieldCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {templates.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Import Templates</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Schema</th>
                  <th className="px-4 py-2 text-left">Format</th>
                  <th className="px-4 py-2 text-left">Default</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id} className="border-t">
                    <td className="px-4 py-2">{template.name}</td>
                    <td className="px-4 py-2">{template.schemaKey}</td>
                    <td className="px-4 py-2">{template.format}</td>
                    <td className="px-4 py-2">{template.isDefault ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {importJobs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Import Jobs</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Format</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Progress</th>
                  <th className="px-4 py-2 text-left">Success</th>
                  <th className="px-4 py-2 text-left">Duplicates</th>
                </tr>
              </thead>
              <tbody>
                {importJobs.map((job) => (
                  <tr key={job.id} className="border-t">
                    <td className="px-4 py-2">{job.module}</td>
                    <td className="px-4 py-2">{job.format}</td>
                    <td className="px-4 py-2">{job.status}</td>
                    <td className="px-4 py-2">{job.progressPct}%</td>
                    <td className="px-4 py-2">{job.successCount}</td>
                    <td className="px-4 py-2">{job.duplicateCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {exportJobs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Export Jobs</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Format</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Progress</th>
                  <th className="px-4 py-2 text-left">Records</th>
                </tr>
              </thead>
              <tbody>
                {exportJobs.map((job) => (
                  <tr key={job.id} className="border-t">
                    <td className="px-4 py-2">{job.module}</td>
                    <td className="px-4 py-2">{job.format}</td>
                    <td className="px-4 py-2">{job.status}</td>
                    <td className="px-4 py-2">{job.progressPct}%</td>
                    <td className="px-4 py-2">{job.successCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {schedules.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Schedules</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Frequency</th>
                  <th className="px-4 py-2 text-left">Next Run</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="border-t">
                    <td className="px-4 py-2">{schedule.name}</td>
                    <td className="px-4 py-2">{schedule.jobType}</td>
                    <td className="px-4 py-2">{schedule.module}</td>
                    <td className="px-4 py-2">{schedule.frequency}</td>
                    <td className="px-4 py-2">{schedule.nextRunAt ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {history.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Job History</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Format</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Source</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {history.map((job) => (
                  <tr key={job.id} className="border-t">
                    <td className="px-4 py-2">{job.jobType}</td>
                    <td className="px-4 py-2">{job.module}</td>
                    <td className="px-4 py-2">{job.format}</td>
                    <td className="px-4 py-2">{job.status}</td>
                    <td className="px-4 py-2">{job.source}</td>
                    <td className="px-4 py-2">{job.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {registrations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Schema Registry</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Key</th>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Name</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((entry) => (
                  <tr key={entry.schemaKey} className="border-t">
                    <td className="px-4 py-2">{entry.schemaKey}</td>
                    <td className="px-4 py-2">{entry.module}</td>
                    <td className="px-4 py-2">{entry.name}</td>
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
