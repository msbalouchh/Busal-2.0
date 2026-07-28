import { ImportExportPlatformLists } from "@/modules/import-export-platform/components/import-export-platform-lists";
import { getImportExportPlatformRegistryContext } from "@/modules/import-export-platform/lib/get-import-export-platform-context";

export default async function ImportExportPlatformRegistryPage() {
  const { schemas, registrations } = await getImportExportPlatformRegistryContext();
  return <ImportExportPlatformLists schemas={schemas} registrations={registrations} />;
}
