import { MonitoringPlatformLists } from "@/modules/monitoring-platform/components/monitoring-platform-lists";
import { getMonitoringPlatformLogsContext } from "@/modules/monitoring-platform/lib/get-monitoring-platform-context";

export default async function MonitoringPlatformLogsPage() {
  const { logs } = await getMonitoringPlatformLogsContext();
  return <MonitoringPlatformLists logs={logs} />;
}
