import { BackupPlatformLists } from "@/modules/backup-platform/components/backup-platform-lists";
import { getBackupPlatformAuditContext } from "@/modules/backup-platform/lib/get-backup-platform-context";

export default async function BackupPlatformAuditPage() {
  const { auditLogs } = await getBackupPlatformAuditContext();
  return <BackupPlatformLists auditLogs={auditLogs} />;
}
