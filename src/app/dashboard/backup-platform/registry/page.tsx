import { BackupPlatformLists } from "@/modules/backup-platform/components/backup-platform-lists";
import { getBackupPlatformRegistryContext } from "@/modules/backup-platform/lib/get-backup-platform-context";

export default async function BackupPlatformRegistryPage() {
  const { registrations, policies } = await getBackupPlatformRegistryContext();
  return <BackupPlatformLists registrations={registrations} policies={policies} />;
}
