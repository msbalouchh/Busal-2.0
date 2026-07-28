import { ImportExportPlatformDashboard } from "@/modules/import-export-platform/components/import-export-platform-dashboard";
import { getImportExportPlatformOverviewContext } from "@/modules/import-export-platform/lib/get-import-export-platform-context";

export default async function ImportExportPlatformOverviewPage() {
  const { dashboard } = await getImportExportPlatformOverviewContext();
  return <ImportExportPlatformDashboard dashboard={dashboard} />;
}
