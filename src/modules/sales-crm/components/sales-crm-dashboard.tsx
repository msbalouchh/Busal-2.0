import type { SalesDashboardView } from "@/modules/sales-crm/utils/sales-utils";
import { formatSalesMoney } from "@/modules/sales-crm/utils/sales-utils";

interface SalesCrmDashboardProps {
  dashboard: SalesDashboardView;
}

export function SalesCrmDashboard({ dashboard }: SalesCrmDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Open Leads</p>
          <p className="text-2xl font-semibold">{dashboard.openLeads}</p>
          <p className="text-muted-foreground mt-1 text-xs">{dashboard.totalLeads} total</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Opportunities</p>
          <p className="text-2xl font-semibold">{dashboard.totalOpportunities}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Open Pipeline Value</p>
          <p className="text-2xl font-semibold">
            {formatSalesMoney(dashboard.openOpportunityValuePence)}
          </p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Won Value</p>
          <p className="text-2xl font-semibold">
            {formatSalesMoney(dashboard.wonOpportunityValuePence)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Pending Tasks</p>
          <p className="text-2xl font-semibold">{dashboard.pendingTasks}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Upcoming Demos</p>
          <p className="text-2xl font-semibold">{dashboard.upcomingDemos}</p>
        </div>
      </div>

      {dashboard.stageBreakdown.length > 0 ? (
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium">Pipeline by Stage</h2>
          <ul className="space-y-2 text-sm">
            {dashboard.stageBreakdown.map((stage) => (
              <li key={stage.stageId} className="flex justify-between gap-3 rounded-md border p-3">
                <span className="font-medium">{stage.stageName}</span>
                <span className="text-muted-foreground">
                  {stage.count} · {formatSalesMoney(stage.valuePence)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
