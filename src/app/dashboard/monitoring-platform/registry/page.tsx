import { MonitoringPlatformLists } from "@/modules/monitoring-platform/components/monitoring-platform-lists";
import { getMonitoringPlatformRegistryContext } from "@/modules/monitoring-platform/lib/get-monitoring-platform-context";

export default async function MonitoringPlatformRegistryPage() {
  const { registrations } = await getMonitoringPlatformRegistryContext();
  return <MonitoringPlatformLists registrations={registrations} />;
}
