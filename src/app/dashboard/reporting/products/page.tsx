import { ProductAnalyticsPanel } from "@/modules/reporting/components/product-analytics-panel";
import { ExportReportButtons } from "@/modules/reporting/components/export-report-buttons";
import { getReportingProductsContext } from "@/modules/reporting/lib/get-reporting-context";

export default async function ReportingProductsPage() {
  const { analytics } = await getReportingProductsContext();

  return (
    <div className="space-y-4">
      <ExportReportButtons reportType="products" />
      <ProductAnalyticsPanel analytics={analytics} />
    </div>
  );
}
