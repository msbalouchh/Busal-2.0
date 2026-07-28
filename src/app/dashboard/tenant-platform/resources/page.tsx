import { TenantPlatformLists } from "@/modules/tenant-platform/components/tenant-platform-lists";
import { getTenantPlatformResourcesContext } from "@/modules/tenant-platform/lib/get-tenant-platform-context";

export default async function TenantPlatformResourcesPage() {
  const { limits, usage } = await getTenantPlatformResourcesContext();
  return <TenantPlatformLists limits={limits ?? undefined} usage={usage ?? undefined} />;
}
