import { MonitoringPlatformDashboard } from "@/modules/monitoring-platform/components/monitoring-platform-dashboard";
import { getMonitoringPlatformOverviewContext } from "@/modules/monitoring-platform/lib/get-monitoring-platform-context";

export default async function MonitoringPlatformOverviewPage() {
  const { dashboard } = await getMonitoringPlatformOverviewContext();
  return <MonitoringPlatformDashboard dashboard={dashboard} />;
}
