interface FilePlatformListsProps {
  files?: Array<{
    id: string;
    originalName: string;
    module: string;
    mimeType: string;
    sizeBytes: number;
    currentVersionNumber: number;
    status: string;
    tags: string[];
  }>;
  folders?: Array<{
    id: string;
    name: string;
    folderType: string;
    path: string;
  }>;
  versions?: Array<{
    id: string;
    versionNumber: number;
    sizeBytes: number;
    changeNotes: string | null;
    createdAt: string;
  }>;
  shareLinks?: Array<{
    id: string;
    linkType: string;
    token: string;
    downloadCount: number;
    isActive: boolean;
  }>;
  permissions?: Array<{
    id: string;
    scope: string;
    level: string;
  }>;
  policies?: Array<{
    id: string;
    name: string;
    retentionDays: number;
    action: string;
    isActive: boolean;
  }>;
  providers?: Array<{
    id: string;
    provider: string;
    name: string;
    isEnabled: boolean;
    isDefault: boolean;
  }>;
  auditLogs?: Array<{
    id: string;
    eventType: string;
    createdAt: string;
  }>;
}

export function FilePlatformLists({
  files = [],
  folders = [],
  versions = [],
  shareLinks = [],
  permissions = [],
  policies = [],
  providers = [],
  auditLogs = [],
}: FilePlatformListsProps) {
  return (
    <div className="space-y-8">
      {files.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">File Registry</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Version</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Size</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="border-t">
                    <td className="px-4 py-2">{file.originalName}</td>
                    <td className="px-4 py-2">{file.module}</td>
                    <td className="px-4 py-2">v{file.currentVersionNumber}</td>
                    <td className="px-4 py-2">{file.status}</td>
                    <td className="px-4 py-2">{file.sizeBytes} B</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {folders.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Folders</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Path</th>
                </tr>
              </thead>
              <tbody>
                {folders.map((folder) => (
                  <tr key={folder.id} className="border-t">
                    <td className="px-4 py-2">{folder.name}</td>
                    <td className="px-4 py-2">{folder.folderType}</td>
                    <td className="px-4 py-2">{folder.path}</td>
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
                  <th className="px-4 py-2 text-left">Version</th>
                  <th className="px-4 py-2 text-left">Size</th>
                  <th className="px-4 py-2 text-left">Notes</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr key={version.id} className="border-t">
                    <td className="px-4 py-2">v{version.versionNumber}</td>
                    <td className="px-4 py-2">{version.sizeBytes} B</td>
                    <td className="px-4 py-2">{version.changeNotes ?? "—"}</td>
                    <td className="px-4 py-2">{new Date(version.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {shareLinks.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Share Links</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Downloads</th>
                  <th className="px-4 py-2 text-left">Active</th>
                </tr>
              </thead>
              <tbody>
                {shareLinks.map((link) => (
                  <tr key={link.id} className="border-t">
                    <td className="px-4 py-2">{link.linkType}</td>
                    <td className="px-4 py-2">{link.downloadCount}</td>
                    <td className="px-4 py-2">{link.isActive ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {permissions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Permissions</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Scope</th>
                  <th className="px-4 py-2 text-left">Level</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((permission) => (
                  <tr key={permission.id} className="border-t">
                    <td className="px-4 py-2">{permission.scope}</td>
                    <td className="px-4 py-2">{permission.level}</td>
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
                  <th className="px-4 py-2 text-left">Days</th>
                  <th className="px-4 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy) => (
                  <tr key={policy.id} className="border-t">
                    <td className="px-4 py-2">{policy.name}</td>
                    <td className="px-4 py-2">{policy.retentionDays}</td>
                    <td className="px-4 py-2">{policy.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {providers.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Storage Providers</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Provider</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Enabled</th>
                  <th className="px-4 py-2 text-left">Default</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr key={provider.id} className="border-t">
                    <td className="px-4 py-2">{provider.provider}</td>
                    <td className="px-4 py-2">{provider.name}</td>
                    <td className="px-4 py-2">{provider.isEnabled ? "Yes" : "No"}</td>
                    <td className="px-4 py-2">{provider.isDefault ? "Yes" : "No"}</td>
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
                  <th className="px-4 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-2">{log.eventType}</td>
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
