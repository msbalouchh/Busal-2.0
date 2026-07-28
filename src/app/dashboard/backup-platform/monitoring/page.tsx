import { BackupPlatformDashboard } from "@/modules/backup-platform/components/backup-platform-dashboard";
import { getBackupPlatformMonitoringContext } from "@/modules/backup-platform/lib/get-backup-platform-context";

export default async function BackupPlatformMonitoringPage() {
  const { dashboard } = await getBackupPlatformMonitoringContext();
  return <BackupPlatformDashboard dashboard={dashboard} />;
}
