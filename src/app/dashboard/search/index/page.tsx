import { SearchPlatformLists } from "@/modules/search-platform/components/search-platform-lists";
import { getSearchPlatformIndexContext } from "@/modules/search-platform/lib/get-search-context";

export default async function SearchPlatformIndexPage() {
  const { records } = await getSearchPlatformIndexContext();
  return <SearchPlatformLists records={records} />;
}
