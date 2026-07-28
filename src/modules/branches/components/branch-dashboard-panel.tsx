import type { BranchDashboardView } from "@/modules/branches/utils/branch-utils";
import { formatBranchMoney } from "@/modules/branches/utils/branch-utils";

interface BranchDashboardPanelProps {
  dashboard: BranchDashboardView;
}

export function BranchDashboardPanel({ dashboard }: BranchDashboardPanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{dashboard.branch.name}</h2>
        <p className="text-muted-foreground text-sm">
          {[dashboard.branch.address, dashboard.branch.city].filter(Boolean).join(", ") ||
            "No address set"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Staff</p>
          <p className="text-2xl font-semibold">{dashboard.staffCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Active Tables</p>
          <p className="text-2xl font-semibold">{dashboard.activeTables}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Today&apos;s Orders</p>
          <p className="text-2xl font-semibold">{dashboard.todayOrders}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Today&apos;s Revenue</p>
          <p className="text-2xl font-semibold">{formatBranchMoney(dashboard.todayRevenuePence)}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Pending Kitchen Orders</p>
        <p className="text-2xl font-semibold">{dashboard.pendingKitchenOrders}</p>
      </div>
    </div>
  );
}
