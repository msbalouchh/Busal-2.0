import { CustomerAnalyticsPanel } from "@/modules/reporting/components/customer-analytics-panel";
import { ExportReportButtons } from "@/modules/reporting/components/export-report-buttons";
import { getReportingCustomersContext } from "@/modules/reporting/lib/get-reporting-context";

export default async function ReportingCustomersPage() {
  const { analytics } = await getReportingCustomersContext();

  return (
    <div className="space-y-4">
      <ExportReportButtons reportType="customers" />
      <CustomerAnalyticsPanel analytics={analytics} />
    </div>
  );
}
