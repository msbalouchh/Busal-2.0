import { TenantPlatformLists } from "@/modules/tenant-platform/components/tenant-platform-lists";
import { getTenantPlatformActivityContext } from "@/modules/tenant-platform/lib/get-tenant-platform-context";

export default async function TenantPlatformActivityPage() {
  const { activities } = await getTenantPlatformActivityContext();
  return <TenantPlatformLists activities={activities} />;
}
