import type { ReportingDashboardView } from "@/modules/reporting/utils/reporting-utils";
import { formatReportingMoney } from "@/modules/reporting/utils/reporting-utils";
import { ChartCard } from "@/modules/reporting/components/widgets/chart-card";
import { KpiCard } from "@/modules/reporting/components/widgets/kpi-card";
import { TrendChart } from "@/modules/reporting/components/widgets/lazy-trend-chart";

interface ReportingDashboardProps {
  dashboard: ReportingDashboardView;
}

export function ReportingDashboard({ dashboard }: ReportingDashboardProps) {
  const { sales, orders, customers, inventory } = dashboard;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Today's Sales" value={formatReportingMoney(sales.todaySalesPence)} />
        <KpiCard label="Weekly Sales" value={formatReportingMoney(sales.weeklySalesPence)} />
        <KpiCard label="Monthly Sales" value={formatReportingMoney(sales.monthlySalesPence)} />
        <KpiCard label="Yearly Sales" value={formatReportingMoney(sales.yearlySalesPence)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Gross Revenue (Today)"
          value={formatReportingMoney(sales.grossRevenuePence)}
        />
        <KpiCard label="Net Revenue (Today)" value={formatReportingMoney(sales.netRevenuePence)} />
        <KpiCard
          label="Average Order Value"
          value={formatReportingMoney(sales.averageOrderValuePence)}
        />
        <KpiCard label="Total Orders (Today)" value={String(sales.totalOrders)} />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Orders by Hour"
          isEmpty={orders.ordersByHour.every((entry) => entry.count === 0)}
        >
          <TrendChart
            data={orders.ordersByHour.map((entry) => ({
              label: `${String(entry.hour).padStart(2, "0")}:00`,
              value: entry.count,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Orders by Day"
          isEmpty={orders.ordersByDay.every((entry) => entry.count === 0)}
        >
          <TrendChart
            variant="line"
            data={orders.ordersByDay.map((entry) => ({
              label: entry.day,
              value: entry.count,
            }))}
          />
        </ChartCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="New Customers" value={String(customers.newCustomers)} />
        <KpiCard label="Returning Customers" value={String(customers.returningCustomers)} />
        <KpiCard label="Retention Rate" value={`${customers.retentionRatePercent}%`} />
        <KpiCard label="Staff Active" value={String(dashboard.staffCount)} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Low Stock Items" value={String(inventory.lowStockCount)} />
        <KpiCard label="Out of Stock" value={String(inventory.outOfStockCount)} />
        <KpiCard
          label="Stock Valuation"
          value={formatReportingMoney(inventory.stockValuationPence)}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Cancelled Orders" value={String(orders.cancelledOrders)} />
        <KpiCard label="Refunds" value={formatReportingMoney(orders.refundsPence)} />
        <KpiCard label="Refund Count" value={String(orders.refundCount)} />
      </section>
    </div>
  );
}
