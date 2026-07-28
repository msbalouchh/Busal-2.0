import type { CustomerSuccessDashboardView } from "@/modules/customer-success/utils/customer-success-utils";

interface CustomerSuccessDashboardProps {
  dashboard: CustomerSuccessDashboardView;
}

function formatGbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export function CustomerSuccessDashboard({ dashboard }: CustomerSuccessDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Total Accounts</p>
        <p className="text-2xl font-semibold">{dashboard.totalAccounts}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Healthy</p>
        <p className="text-2xl font-semibold">{dashboard.healthyAccounts}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">At Risk / Critical</p>
        <p className="text-2xl font-semibold">
          {dashboard.atRiskAccounts + dashboard.criticalAccounts}
        </p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Open Tasks</p>
        <p className="text-2xl font-semibold">{dashboard.openTasks}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Upcoming Renewals</p>
        <p className="text-2xl font-semibold">{dashboard.upcomingRenewals}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Open Feedback</p>
        <p className="text-2xl font-semibold">{dashboard.openFeedback}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm md:col-span-2">
        <p className="text-muted-foreground text-sm">Expansion Pipeline</p>
        <p className="text-2xl font-semibold">{formatGbp(dashboard.expansionPipelinePence)}</p>
      </div>
    </div>
  );
}
