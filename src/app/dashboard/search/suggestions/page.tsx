import { SearchPlatformLists } from "@/modules/search-platform/components/search-platform-lists";
import { getSearchPlatformSuggestionsContext } from "@/modules/search-platform/lib/get-search-context";

export default async function SearchPlatformSuggestionsPage() {
  const { suggestions } = await getSearchPlatformSuggestionsContext();
  return <SearchPlatformLists suggestions={suggestions} />;
}
