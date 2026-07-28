import { MonitoringPlatformLists } from "@/modules/monitoring-platform/components/monitoring-platform-lists";
import { getMonitoringPlatformHealthContext } from "@/modules/monitoring-platform/lib/get-monitoring-platform-context";

export default async function MonitoringPlatformHealthPage() {
  const { checks } = await getMonitoringPlatformHealthContext();
  return <MonitoringPlatformLists checks={checks} />;
}
