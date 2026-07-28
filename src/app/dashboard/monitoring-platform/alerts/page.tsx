import { MonitoringPlatformLists } from "@/modules/monitoring-platform/components/monitoring-platform-lists";
import { getMonitoringPlatformAlertsContext } from "@/modules/monitoring-platform/lib/get-monitoring-platform-context";

export default async function MonitoringPlatformAlertsPage() {
  const { alerts } = await getMonitoringPlatformAlertsContext();
  return <MonitoringPlatformLists alerts={alerts} />;
}
