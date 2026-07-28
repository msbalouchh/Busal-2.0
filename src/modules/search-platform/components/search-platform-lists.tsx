interface SearchPlatformListsProps {
  records?: Array<{
    id: string;
    entityType: string;
    entityId: string;
    title: string;
    status: string;
    lastIndexedAt: string | null;
  }>;
  queries?: Array<{
    id: string;
    query: string;
    matchMode: string;
    resultCount: number;
    createdAt: string;
  }>;
  suggestions?: Array<{
    id: string;
    suggestionType: string;
    query: string;
    hitCount: number;
    lastUsedAt: string;
  }>;
  jobs?: Array<{
    id: string;
    jobType: string;
    status: string;
    entityType: string | null;
    queuedAt: string;
    completedAt: string | null;
  }>;
  auditLogs?: Array<{
    id: string;
    eventType: string;
    createdAt: string;
  }>;
  registrations?: Array<{
    entityType: string;
    label: string;
    module: string;
    requiredPermission: string;
  }>;
  searchGroups?: Array<{
    entityType: string;
    label: string;
    count: number;
    results: Array<{
      id: string;
      title: string;
      description: string;
      entityType: string;
      businessName?: string;
      branchName?: string;
      highlights: Array<{ field: string; snippet: string }>;
    }>;
  }>;
}

export function SearchPlatformLists({
  records = [],
  queries = [],
  suggestions = [],
  jobs = [],
  auditLogs = [],
  registrations = [],
  searchGroups = [],
}: SearchPlatformListsProps) {
  return (
    <div className="space-y-8">
      {searchGroups.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Global Search Results</h2>
          {searchGroups.map((group) => (
            <div key={group.entityType} className="space-y-2 rounded-xl border p-4">
              <h3 className="font-medium">
                {group.label} ({group.count})
              </h3>
              <div className="space-y-2">
                {group.results.map((result) => (
                  <div key={result.id} className="rounded-lg border p-3">
                    <p className="font-medium">{result.title}</p>
                    <p className="text-muted-foreground text-sm">{result.description}</p>
                    <p className="text-muted-foreground text-xs">
                      {result.entityType}
                      {result.businessName ? ` · ${result.businessName}` : ""}
                      {result.branchName ? ` · ${result.branchName}` : ""}
                    </p>
                    {result.highlights.length > 0 ? (
                      <p className="text-primary mt-1 text-xs">
                        Match: {result.highlights.map((h) => h.snippet).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {records.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Search Index</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Entity</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Last Indexed</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-t">
                    <td className="px-4 py-2">{record.title}</td>
                    <td className="px-4 py-2">
                      {record.entityType} · {record.entityId}
                    </td>
                    <td className="px-4 py-2">{record.status}</td>
                    <td className="px-4 py-2">{record.lastIndexedAt ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {queries.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Search Queries</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Query</th>
                  <th className="px-4 py-2 text-left">Mode</th>
                  <th className="px-4 py-2 text-left">Results</th>
                  <th className="px-4 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {queries.map((query) => (
                  <tr key={query.id} className="border-t">
                    <td className="px-4 py-2">{query.query}</td>
                    <td className="px-4 py-2">{query.matchMode}</td>
                    <td className="px-4 py-2">{query.resultCount}</td>
                    <td className="px-4 py-2">{query.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {suggestions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Suggestions</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Query</th>
                  <th className="px-4 py-2 text-left">Hits</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((suggestion) => (
                  <tr key={suggestion.id} className="border-t">
                    <td className="px-4 py-2">{suggestion.suggestionType}</td>
                    <td className="px-4 py-2">{suggestion.query}</td>
                    <td className="px-4 py-2">{suggestion.hitCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {jobs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Index Jobs</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Entity</th>
                  <th className="px-4 py-2 text-left">Queued</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-t">
                    <td className="px-4 py-2">{job.jobType}</td>
                    <td className="px-4 py-2">{job.status}</td>
                    <td className="px-4 py-2">{job.entityType ?? "—"}</td>
                    <td className="px-4 py-2">{job.queuedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {registrations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Entity Registry</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Entity</th>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Permission</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => (
                  <tr key={registration.entityType} className="border-t">
                    <td className="px-4 py-2">{registration.label}</td>
                    <td className="px-4 py-2">{registration.module}</td>
                    <td className="px-4 py-2">{registration.requiredPermission}</td>
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
                  <th className="px-4 py-2 text-left">Date</th>
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
