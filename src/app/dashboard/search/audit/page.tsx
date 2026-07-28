import { SearchPlatformLists } from "@/modules/search-platform/components/search-platform-lists";
import { getSearchPlatformAuditContext } from "@/modules/search-platform/lib/get-search-context";

export default async function SearchPlatformAuditPage() {
  const { auditLogs } = await getSearchPlatformAuditContext();
  return <SearchPlatformLists auditLogs={auditLogs} />;
}
