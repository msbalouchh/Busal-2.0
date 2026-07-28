import { BackupPlatformLists } from "@/modules/backup-platform/components/backup-platform-lists";
import { getBackupPlatformRetentionContext } from "@/modules/backup-platform/lib/get-backup-platform-context";

export default async function BackupPlatformRetentionPage() {
  const { policies } = await getBackupPlatformRetentionContext();
  return <BackupPlatformLists retentionPolicies={policies} />;
}
