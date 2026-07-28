import { ImportExportPlatformLists } from "@/modules/import-export-platform/components/import-export-platform-lists";
import { getImportExportPlatformSchedulesContext } from "@/modules/import-export-platform/lib/get-import-export-platform-context";

export default async function ImportExportPlatformSchedulesPage() {
  const { schedules } = await getImportExportPlatformSchedulesContext();
  return <ImportExportPlatformLists schedules={schedules} />;
}
