import { MonitoringPlatformLists } from "@/modules/monitoring-platform/components/monitoring-platform-lists";
import { getMonitoringPlatformErrorsContext } from "@/modules/monitoring-platform/lib/get-monitoring-platform-context";

export default async function MonitoringPlatformErrorsPage() {
  const { errors } = await getMonitoringPlatformErrorsContext();
  return <MonitoringPlatformLists errors={errors} />;
}
