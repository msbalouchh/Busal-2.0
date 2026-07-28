import { MonitoringPlatformLists } from "@/modules/monitoring-platform/components/monitoring-platform-lists";
import { getMonitoringPlatformPerformanceContext } from "@/modules/monitoring-platform/lib/get-monitoring-platform-context";

export default async function MonitoringPlatformPerformancePage() {
  const { logs } = await getMonitoringPlatformPerformanceContext();
  return <MonitoringPlatformLists performance={logs} />;
}
