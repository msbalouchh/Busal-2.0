import { MonitoringPlatformLists } from "@/modules/monitoring-platform/components/monitoring-platform-lists";
import { getMonitoringPlatformAuditContext } from "@/modules/monitoring-platform/lib/get-monitoring-platform-context";

export default async function MonitoringPlatformAuditPage() {
  const { auditLogs } = await getMonitoringPlatformAuditContext();
  return <MonitoringPlatformLists auditLogs={auditLogs} />;
}
