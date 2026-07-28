import type { SearchPlatformDashboardView } from "@/modules/search-platform/utils/search-utils";

interface SearchPlatformDashboardProps {
  dashboard: SearchPlatformDashboardView;
}

export function SearchPlatformDashboard({ dashboard }: SearchPlatformDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Total Index Records</p>
        <p className="text-2xl font-semibold">{dashboard.totalRecords}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Indexed</p>
        <p className="text-2xl font-semibold">{dashboard.indexedRecords}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Failed</p>
        <p className="text-2xl font-semibold">{dashboard.failedRecords}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Stale</p>
        <p className="text-2xl font-semibold">{dashboard.staleRecords}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Queued Jobs</p>
        <p className="text-2xl font-semibold">{dashboard.queuedJobs}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Registered Entity Types</p>
        <p className="text-2xl font-semibold">{dashboard.registeredEntityTypes}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Total Queries</p>
        <p className="text-2xl font-semibold">{dashboard.totalQueries}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Recent Queries (7d)</p>
        <p className="text-2xl font-semibold">{dashboard.recentQueries}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">AI Search Architecture</p>
        <p className="text-2xl font-semibold">{dashboard.aiSearchReady ? "Prepared" : "Pending"}</p>
      </div>
    </div>
  );
}
