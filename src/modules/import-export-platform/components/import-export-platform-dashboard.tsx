import type { ImportExportPlatformDashboardView } from "@/modules/import-export-platform/utils/import-export-platform-utils";

interface ImportExportPlatformDashboardProps {
  dashboard: ImportExportPlatformDashboardView;
}

export function ImportExportPlatformDashboard({ dashboard }: ImportExportPlatformDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Schemas</p>
        <p className="text-2xl font-semibold">{dashboard.totalSchemas}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Registered Schemas</p>
        <p className="text-2xl font-semibold">{dashboard.registeredSchemas}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Templates</p>
        <p className="text-2xl font-semibold">{dashboard.totalTemplates}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Import Jobs</p>
        <p className="text-2xl font-semibold">{dashboard.totalImportJobs}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Export Jobs</p>
        <p className="text-2xl font-semibold">{dashboard.totalExportJobs}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Completed Jobs</p>
        <p className="text-2xl font-semibold">{dashboard.completedJobs}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Active Schedules</p>
        <p className="text-2xl font-semibold">{dashboard.activeSchedules}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Records Processed</p>
        <p className="text-2xl font-semibold">{dashboard.totalRecordsProcessed}</p>
      </div>
    </div>
  );
}
