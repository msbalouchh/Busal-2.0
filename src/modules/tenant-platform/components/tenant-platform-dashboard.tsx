import { formatMaintenanceLabel } from "@/modules/tenant-platform/engine/maintenance-engine";
import type { TenantPlatformDashboardView } from "@/modules/tenant-platform/utils/tenant-platform-utils";

interface TenantPlatformDashboardProps {
  dashboard: TenantPlatformDashboardView;
}

export function TenantPlatformDashboard({ dashboard }: TenantPlatformDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Lifecycle</p>
        <p className="text-2xl font-semibold">{dashboard.lifecycleStatus}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Health</p>
        <p className="text-2xl font-semibold">{dashboard.healthStatus}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Subscription</p>
        <p className="text-2xl font-semibold">{dashboard.subscriptionPlan ?? "None"}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Branches</p>
        <p className="text-2xl font-semibold">{dashboard.branchCount}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Features</p>
        <p className="text-2xl font-semibold">{dashboard.assignedFeatureCount}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Active Policies</p>
        <p className="text-2xl font-semibold">{dashboard.activePolicies}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Maintenance</p>
        <p className="text-2xl font-semibold">
          {formatMaintenanceLabel(dashboard.maintenanceMode)}
        </p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Activity Events</p>
        <p className="text-2xl font-semibold">{dashboard.totalActivityEvents}</p>
      </div>
    </div>
  );
}
