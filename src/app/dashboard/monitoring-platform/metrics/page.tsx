import { MonitoringPlatformLists } from "@/modules/monitoring-platform/components/monitoring-platform-lists";
import { getMonitoringPlatformMetricsContext } from "@/modules/monitoring-platform/lib/get-monitoring-platform-context";

export default async function MonitoringPlatformMetricsPage() {
  const { snapshots } = await getMonitoringPlatformMetricsContext();
  return <MonitoringPlatformLists snapshots={snapshots} />;
}
