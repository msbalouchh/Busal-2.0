import type { FilePlatformDashboardView } from "@/modules/file-platform/utils/file-platform-utils";

interface FilePlatformDashboardProps {
  dashboard: FilePlatformDashboardView;
}

export function FilePlatformDashboard({ dashboard }: FilePlatformDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Total Files</p>
        <p className="text-2xl font-semibold">{dashboard.totalFiles}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Active Files</p>
        <p className="text-2xl font-semibold">{dashboard.activeFiles}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Folders</p>
        <p className="text-2xl font-semibold">{dashboard.totalFolders}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Share Links</p>
        <p className="text-2xl font-semibold">{dashboard.sharedLinks}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Archived</p>
        <p className="text-2xl font-semibold">{dashboard.archivedFiles}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Storage Providers</p>
        <p className="text-2xl font-semibold">{dashboard.storageProviders}</p>
      </div>
    </div>
  );
}
