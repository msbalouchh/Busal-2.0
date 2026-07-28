import { ReportingDashboard } from "@/modules/reporting/components/reporting-dashboard";
import { getReportingOverviewContext } from "@/modules/reporting/lib/get-reporting-context";

export default async function ReportingOverviewPage() {
  const { dashboard } = await getReportingOverviewContext();

  return <ReportingDashboard dashboard={dashboard} />;
}
