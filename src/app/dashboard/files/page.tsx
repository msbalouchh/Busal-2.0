import { FilePlatformDashboard } from "@/modules/file-platform/components/file-platform-dashboard";
import { getFilePlatformOverviewContext } from "@/modules/file-platform/lib/get-file-platform-context";

export default async function FilePlatformOverviewPage() {
  const { dashboard } = await getFilePlatformOverviewContext();
  return <FilePlatformDashboard dashboard={dashboard} />;
}
