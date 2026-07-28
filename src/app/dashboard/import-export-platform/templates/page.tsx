import { ImportExportPlatformLists } from "@/modules/import-export-platform/components/import-export-platform-lists";
import { getImportExportPlatformTemplatesContext } from "@/modules/import-export-platform/lib/get-import-export-platform-context";

export default async function ImportExportPlatformTemplatesPage() {
  const { templates } = await getImportExportPlatformTemplatesContext();
  return <ImportExportPlatformLists templates={templates} />;
}
