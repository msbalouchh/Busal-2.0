import { FilePlatformLists } from "@/modules/file-platform/components/file-platform-lists";
import { getFilePlatformAuditContext } from "@/modules/file-platform/lib/get-file-platform-context";

export default async function FilePlatformAuditPage() {
  const { auditLogs } = await getFilePlatformAuditContext();
  return <FilePlatformLists auditLogs={auditLogs} />;
}
