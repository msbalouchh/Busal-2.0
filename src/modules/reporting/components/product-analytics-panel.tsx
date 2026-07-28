import type { ProductAnalyticsView } from "@/modules/reporting/utils/reporting-utils";
import { formatReportingMoney } from "@/modules/reporting/utils/reporting-utils";
import { DataTableWidget } from "@/modules/reporting/components/widgets/data-table-widget";

interface ProductAnalyticsPanelProps {
  analytics: ProductAnalyticsView;
}

export function ProductAnalyticsPanel({ analytics }: ProductAnalyticsPanelProps) {
  const productRows = (items: ProductAnalyticsView["bestSelling"]) =>
    items.map((item) => [
      item.name,
      item.categoryName ?? "—",
      String(item.quantitySold),
      formatReportingMoney(item.revenuePence),
    ]);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-2">
        <DataTableWidget
          title="Best-selling Items"
          headers={["Item", "Category", "Qty", "Revenue"]}
          rows={productRows(analytics.bestSelling)}
        />
        <DataTableWidget
          title="Worst-selling Items"
          headers={["Item", "Category", "Qty", "Revenue"]}
          rows={productRows(analytics.worstSelling)}
        />
      </section>

      <DataTableWidget
        title="Category Performance"
        headers={["Category", "Quantity Sold", "Revenue"]}
        rows={analytics.categoryPerformance.map((entry) => [
          entry.categoryName,
          String(entry.quantitySold),
          formatReportingMoney(entry.revenuePence),
        ])}
      />

      <DataTableWidget
        title="Top Revenue Items"
        headers={["Item", "Category", "Qty", "Revenue"]}
        rows={productRows(analytics.topRevenueItems)}
      />
    </div>
  );
}
