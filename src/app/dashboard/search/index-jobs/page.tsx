import { SearchPlatformLists } from "@/modules/search-platform/components/search-platform-lists";
import { getSearchPlatformIndexJobsContext } from "@/modules/search-platform/lib/get-search-context";

export default async function SearchPlatformIndexJobsPage() {
  const { jobs } = await getSearchPlatformIndexJobsContext();
  return <SearchPlatformLists jobs={jobs} />;
}
