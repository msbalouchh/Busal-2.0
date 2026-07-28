import type { SettingsEngineDashboardView } from "@/modules/settings-engine/utils/settings-utils";

interface SettingsEngineDashboardProps {
  dashboard: SettingsEngineDashboardView;
}

export function SettingsEngineDashboard({ dashboard }: SettingsEngineDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Definitions</p>
        <p className="text-2xl font-semibold">{dashboard.totalDefinitions}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Active Definitions</p>
        <p className="text-2xl font-semibold">{dashboard.activeDefinitions}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Configured Values</p>
        <p className="text-2xl font-semibold">{dashboard.totalValues}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Scoped Overrides</p>
        <p className="text-2xl font-semibold">{dashboard.scopedOverrides}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Versions</p>
        <p className="text-2xl font-semibold">{dashboard.versionCount}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Audit Events</p>
        <p className="text-2xl font-semibold">{dashboard.auditEvents}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Categories</p>
        <p className="text-2xl font-semibold">{dashboard.categories}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Environments</p>
        <p className="text-2xl font-semibold">{dashboard.environments}</p>
      </div>
    </div>
  );
}
