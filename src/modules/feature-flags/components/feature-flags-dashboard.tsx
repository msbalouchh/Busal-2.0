import type { FeatureFlagsDashboardView } from "@/modules/feature-flags/utils/feature-flags-utils";

interface FeatureFlagsDashboardProps {
  dashboard: FeatureFlagsDashboardView;
}

export function FeatureFlagsDashboard({ dashboard }: FeatureFlagsDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Total Flags</p>
        <p className="text-2xl font-semibold">{dashboard.totalFlags}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Active</p>
        <p className="text-2xl font-semibold">{dashboard.activeFlags}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Scheduled</p>
        <p className="text-2xl font-semibold">{dashboard.scheduledFlags}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Archived</p>
        <p className="text-2xl font-semibold">{dashboard.archivedFlags}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Registered Features</p>
        <p className="text-2xl font-semibold">{dashboard.registeredFeatures}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Targeting Rules</p>
        <p className="text-2xl font-semibold">{dashboard.targetingRules}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Total Evaluations</p>
        <p className="text-2xl font-semibold">{dashboard.totalEvaluations}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Recent Evaluations (7d)</p>
        <p className="text-2xl font-semibold">{dashboard.recentEvaluations}</p>
      </div>
    </div>
  );
}
