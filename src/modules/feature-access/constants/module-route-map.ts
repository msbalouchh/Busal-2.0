import { PLATFORM_MODULE_KEYS, type PlatformModuleKey } from "@/modules/feature-access";

/** Maps URL prefixes to platform module keys for route-level entitlement checks. */
export const MODULE_ROUTE_MAP: Array<{ prefix: string; moduleKey: PlatformModuleKey }> = [
  { prefix: "/dashboard/finance", moduleKey: PLATFORM_MODULE_KEYS.FINANCE },
  { prefix: "/dashboard/billing", moduleKey: PLATFORM_MODULE_KEYS.BILLING },
  { prefix: "/dashboard/analytics", moduleKey: PLATFORM_MODULE_KEYS.ANALYTICS },
  { prefix: "/dashboard/inventory", moduleKey: PLATFORM_MODULE_KEYS.INVENTORY },
  { prefix: "/dashboard/staff", moduleKey: PLATFORM_MODULE_KEYS.STAFF },
  { prefix: "/dashboard/kitchen", moduleKey: PLATFORM_MODULE_KEYS.KITCHEN },
  { prefix: "/dashboard/pos", moduleKey: PLATFORM_MODULE_KEYS.POS },
  { prefix: "/dashboard/orders", moduleKey: PLATFORM_MODULE_KEYS.ORDERS },
  { prefix: "/dashboard/reservations", moduleKey: PLATFORM_MODULE_KEYS.RESERVATIONS },
  { prefix: "/dashboard/tables", moduleKey: PLATFORM_MODULE_KEYS.TABLES },
  { prefix: "/dashboard/customers", moduleKey: PLATFORM_MODULE_KEYS.CRM },
  { prefix: "/dashboard/menu", moduleKey: PLATFORM_MODULE_KEYS.MENU },
  { prefix: "/dashboard/notifications", moduleKey: PLATFORM_MODULE_KEYS.NOTIFICATIONS },
  { prefix: "/dashboard/ai", moduleKey: PLATFORM_MODULE_KEYS.AI },
  { prefix: "/api/finance", moduleKey: PLATFORM_MODULE_KEYS.FINANCE },
  { prefix: "/api/inventory", moduleKey: PLATFORM_MODULE_KEYS.INVENTORY },
  { prefix: "/api/staff", moduleKey: PLATFORM_MODULE_KEYS.STAFF },
  { prefix: "/api/kitchen", moduleKey: PLATFORM_MODULE_KEYS.KITCHEN },
  { prefix: "/api/pos", moduleKey: PLATFORM_MODULE_KEYS.POS },
  { prefix: "/api/orders", moduleKey: PLATFORM_MODULE_KEYS.ORDERS },
  { prefix: "/api/reservations", moduleKey: PLATFORM_MODULE_KEYS.RESERVATIONS },
  { prefix: "/api/crm", moduleKey: PLATFORM_MODULE_KEYS.CRM },
  { prefix: "/api/menu", moduleKey: PLATFORM_MODULE_KEYS.MENU },
  { prefix: "/api/notifications", moduleKey: PLATFORM_MODULE_KEYS.NOTIFICATIONS },
  { prefix: "/api/analytics", moduleKey: PLATFORM_MODULE_KEYS.ANALYTICS },
  { prefix: "/api/billing", moduleKey: PLATFORM_MODULE_KEYS.BILLING },
  { prefix: "/api/integrations", moduleKey: PLATFORM_MODULE_KEYS.API_PLATFORM },
];

export function resolveModuleKeyForPath(pathname: string): PlatformModuleKey | null {
  const match = MODULE_ROUTE_MAP.find((entry) => pathname.startsWith(entry.prefix));
  return match?.moduleKey ?? null;
}
