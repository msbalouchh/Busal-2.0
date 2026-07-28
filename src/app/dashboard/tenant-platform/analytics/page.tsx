import { TenantPlatformLists } from "@/modules/tenant-platform/components/tenant-platform-lists";
import { getTenantPlatformAnalyticsContext } from "@/modules/tenant-platform/lib/get-tenant-platform-context";

export default async function TenantPlatformAnalyticsPage() {
  const { analytics } = await getTenantPlatformAnalyticsContext();
  return <TenantPlatformLists analytics={analytics} />;
}
