import type { InventoryAnalyticsView } from "@/modules/reporting/utils/reporting-utils";
import { formatReportingMoney } from "@/modules/reporting/utils/reporting-utils";
import { DataTableWidget } from "@/modules/reporting/components/widgets/data-table-widget";
import { KpiCard } from "@/modules/reporting/components/widgets/kpi-card";

interface InventoryAnalyticsPanelProps {
  analytics: InventoryAnalyticsView;
}

export function InventoryAnalyticsPanel({ analytics }: InventoryAnalyticsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Low Stock" value={String(analytics.lowStockCount)} />
        <KpiCard label="Out of Stock" value={String(analytics.outOfStockCount)} />
        <KpiCard
          label="Stock Valuation"
          value={formatReportingMoney(analytics.stockValuationPence)}
        />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <DataTableWidget
          title="Ingredient Usage"
          headers={["Ingredient", "Quantity Used"]}
          rows={analytics.ingredientUsage.map((entry) => [
            entry.ingredientName,
            entry.quantityUsed,
          ])}
        />
        <DataTableWidget
          title="Waste Analysis"
          headers={["Ingredient", "Waste Quantity"]}
          rows={analytics.wasteAnalysis.map((entry) => [entry.ingredientName, entry.wasteQuantity])}
        />
      </section>
    </div>
  );
}
