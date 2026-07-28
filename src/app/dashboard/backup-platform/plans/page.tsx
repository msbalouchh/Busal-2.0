import { BackupPlatformLists } from "@/modules/backup-platform/components/backup-platform-lists";
import { getBackupPlatformPlansContext } from "@/modules/backup-platform/lib/get-backup-platform-context";

export default async function BackupPlatformPlansPage() {
  const { plans } = await getBackupPlatformPlansContext();
  return <BackupPlatformLists plans={plans} />;
}
