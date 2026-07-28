import { TenantPlatformLists } from "@/modules/tenant-platform/components/tenant-platform-lists";
import { getTenantPlatformSecurityContext } from "@/modules/tenant-platform/lib/get-tenant-platform-context";

export default async function TenantPlatformSecurityPage() {
  const { policies, registrations } = await getTenantPlatformSecurityContext();
  return <TenantPlatformLists policies={policies} registrations={registrations} />;
}
