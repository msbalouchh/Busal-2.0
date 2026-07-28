import { ImportExportPlatformLists } from "@/modules/import-export-platform/components/import-export-platform-lists";
import { getImportExportPlatformHistoryContext } from "@/modules/import-export-platform/lib/get-import-export-platform-context";

export default async function ImportExportPlatformHistoryPage() {
  const { history } = await getImportExportPlatformHistoryContext();
  return <ImportExportPlatformLists history={history} />;
}
