import { ImportExportPlatformLists } from "@/modules/import-export-platform/components/import-export-platform-lists";
import { getImportExportPlatformImportsContext } from "@/modules/import-export-platform/lib/get-import-export-platform-context";

export default async function ImportExportPlatformImportsPage() {
  const { importJobs } = await getImportExportPlatformImportsContext();
  return <ImportExportPlatformLists importJobs={importJobs} />;
}
