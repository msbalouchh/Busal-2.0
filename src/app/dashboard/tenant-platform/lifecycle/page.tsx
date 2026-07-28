import { TenantPlatformLists } from "@/modules/tenant-platform/components/tenant-platform-lists";
import { getTenantPlatformLifecycleContext } from "@/modules/tenant-platform/lib/get-tenant-platform-context";

export default async function TenantPlatformLifecyclePage() {
  const { tenant } = await getTenantPlatformLifecycleContext();
  return <TenantPlatformLists tenant={tenant ?? undefined} />;
}
