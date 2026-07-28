import { BackupPlatformDashboard } from "@/modules/backup-platform/components/backup-platform-dashboard";
import { getBackupPlatformOverviewContext } from "@/modules/backup-platform/lib/get-backup-platform-context";

export default async function BackupPlatformOverviewPage() {
  const { dashboard } = await getBackupPlatformOverviewContext();
  return <BackupPlatformDashboard dashboard={dashboard} />;
}
