import { BackupPlatformLists } from "@/modules/backup-platform/components/backup-platform-lists";
import { getBackupPlatformRecoveryContext } from "@/modules/backup-platform/lib/get-backup-platform-context";

export default async function BackupPlatformRecoveryPage() {
  const { jobs } = await getBackupPlatformRecoveryContext();
  return <BackupPlatformLists jobs={jobs} />;
}
