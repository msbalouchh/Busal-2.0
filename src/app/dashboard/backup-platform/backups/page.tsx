import { BackupPlatformLists } from "@/modules/backup-platform/components/backup-platform-lists";
import { getBackupPlatformBackupsContext } from "@/modules/backup-platform/lib/get-backup-platform-context";

export default async function BackupPlatformBackupsPage() {
  const { backups } = await getBackupPlatformBackupsContext();
  return <BackupPlatformLists backups={backups} />;
}
