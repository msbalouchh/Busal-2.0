import { TenantPlatformLists } from "@/modules/tenant-platform/components/tenant-platform-lists";
import { getTenantPlatformHealthContext } from "@/modules/tenant-platform/lib/get-tenant-platform-context";

export default async function TenantPlatformHealthPage() {
  const { health } = await getTenantPlatformHealthContext();
  return <TenantPlatformLists health={health} />;
}
