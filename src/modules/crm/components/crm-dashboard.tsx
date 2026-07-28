import type { CrmDashboardView } from "@/modules/crm/types/crm";
import { formatCrmMoney } from "@/modules/crm/utils/crm-utils";

interface CrmDashboardProps {
  dashboard: CrmDashboardView;
}

export function CrmDashboard({ dashboard }: CrmDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Total Customers</p>
          <p className="text-2xl font-semibold">{dashboard.totalCustomers}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">New (30 days)</p>
          <p className="text-2xl font-semibold">{dashboard.newCustomers}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Returning</p>
          <p className="text-2xl font-semibold">{dashboard.returningCustomers}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">VIP</p>
          <p className="text-2xl font-semibold">{dashboard.vipCustomers}</p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Top Spenders</h3>
          {dashboard.topSpenders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No customer spend data yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {dashboard.topSpenders.map((customer) => (
                <li key={customer.id} className="flex justify-between gap-3">
                  <span>{customer.name}</span>
                  <span>{formatCrmMoney(customer.totalSpentPence)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Loyalty Statistics</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Outstanding points</span>
              <span>{dashboard.loyaltyStatistics.totalPointsOutstanding}</span>
            </li>
            <li className="flex justify-between">
              <span>Point transactions</span>
              <span>{dashboard.loyaltyStatistics.totalPointTransactions}</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
