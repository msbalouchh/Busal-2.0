import { SearchPlatformDashboard } from "@/modules/search-platform/components/search-platform-dashboard";
import { getSearchPlatformOverviewContext } from "@/modules/search-platform/lib/get-search-context";

export default async function SearchPlatformOverviewPage() {
  const { dashboard } = await getSearchPlatformOverviewContext();
  return <SearchPlatformDashboard dashboard={dashboard} />;
}
