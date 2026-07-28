import type { MonitoringPlatformDashboardView } from "@/modules/monitoring-platform/utils/monitoring-platform-utils";

interface MonitoringPlatformDashboardProps {
  dashboard: MonitoringPlatformDashboardView;
}

export function MonitoringPlatformDashboard({ dashboard }: MonitoringPlatformDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Health Checks</p>
        <p className="text-2xl font-semibold">{dashboard.totalHealthChecks}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Healthy</p>
        <p className="text-2xl font-semibold">{dashboard.healthyChecks}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Degraded</p>
        <p className="text-2xl font-semibold">{dashboard.degradedChecks}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Unhealthy</p>
        <p className="text-2xl font-semibold">{dashboard.unhealthyChecks}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Active Alerts</p>
        <p className="text-2xl font-semibold">{dashboard.activeAlerts}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Recent Errors (7d)</p>
        <p className="text-2xl font-semibold">{dashboard.recentErrors}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Avg Response Time</p>
        <p className="text-2xl font-semibold">{dashboard.avgResponseTimeMs}ms</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Slow Requests</p>
        <p className="text-2xl font-semibold">{dashboard.slowRequests}</p>
      </div>
    </div>
  );
}
