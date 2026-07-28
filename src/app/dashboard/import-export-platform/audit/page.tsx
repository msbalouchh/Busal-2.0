import { ImportExportPlatformLists } from "@/modules/import-export-platform/components/import-export-platform-lists";
import { getImportExportPlatformAuditContext } from "@/modules/import-export-platform/lib/get-import-export-platform-context";

export default async function ImportExportPlatformAuditPage() {
  const { auditLogs } = await getImportExportPlatformAuditContext();
  return <ImportExportPlatformLists auditLogs={auditLogs} />;
}
