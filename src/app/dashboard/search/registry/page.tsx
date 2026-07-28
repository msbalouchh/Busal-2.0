import { SearchPlatformLists } from "@/modules/search-platform/components/search-platform-lists";
import { getSearchPlatformRegistryContext } from "@/modules/search-platform/lib/get-search-context";

export default async function SearchPlatformRegistryPage() {
  const { registrations } = await getSearchPlatformRegistryContext();
  return <SearchPlatformLists registrations={registrations} />;
}
