import { MonitoringPlatformLists } from "@/modules/monitoring-platform/components/monitoring-platform-lists";
import { getMonitoringPlatformRetentionContext } from "@/modules/monitoring-platform/lib/get-monitoring-platform-context";

export default async function MonitoringPlatformRetentionPage() {
  const { policies } = await getMonitoringPlatformRetentionContext();
  return <MonitoringPlatformLists policies={policies} />;
}
