import { ImportExportPlatformLists } from "@/modules/import-export-platform/components/import-export-platform-lists";
import { getImportExportPlatformExportsContext } from "@/modules/import-export-platform/lib/get-import-export-platform-context";

export default async function ImportExportPlatformExportsPage() {
  const { exportJobs } = await getImportExportPlatformExportsContext();
  return <ImportExportPlatformLists exportJobs={exportJobs} />;
}
