import { TenantPlatformLists } from "@/modules/tenant-platform/components/tenant-platform-lists";
import { getTenantPlatformBusinessContext } from "@/modules/tenant-platform/lib/get-tenant-platform-context";

export default async function TenantPlatformBusinessPage() {
  const { tenant, settings } = await getTenantPlatformBusinessContext();
  return <TenantPlatformLists tenant={tenant ?? undefined} settings={settings ?? undefined} />;
}
