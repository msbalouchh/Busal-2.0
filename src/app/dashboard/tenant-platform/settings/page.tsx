import { TenantPlatformLists } from "@/modules/tenant-platform/components/tenant-platform-lists";
import { getTenantPlatformSettingsContext } from "@/modules/tenant-platform/lib/get-tenant-platform-context";

export default async function TenantPlatformSettingsPage() {
  const { settings } = await getTenantPlatformSettingsContext();
  return <TenantPlatformLists settings={settings ?? undefined} />;
}
