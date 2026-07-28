import { SalesDashboardView } from "@/modules/reporting/components/sales-dashboard-view";
import { ExportReportButtons } from "@/modules/reporting/components/export-report-buttons";
import { getReportingSalesContext } from "@/modules/reporting/lib/get-reporting-context";

export default async function ReportingSalesPage() {
  const { sales } = await getReportingSalesContext();

  return (
    <div className="space-y-4">
      <ExportReportButtons reportType="sales" />
      <SalesDashboardView sales={sales} />
    </div>
  );
}
