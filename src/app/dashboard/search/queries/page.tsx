import { SearchPlatformLists } from "@/modules/search-platform/components/search-platform-lists";
import { getSearchPlatformQueriesContext } from "@/modules/search-platform/lib/get-search-context";

export default async function SearchPlatformQueriesPage() {
  const { queries } = await getSearchPlatformQueriesContext();
  return <SearchPlatformLists queries={queries} />;
}
