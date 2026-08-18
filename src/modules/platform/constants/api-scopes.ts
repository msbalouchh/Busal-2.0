/** Canonical public API scope identifiers (resource:action). */
export const PLATFORM_API_SCOPES = {
  BUSINESS_READ: "business:read",
  BUSINESS_WRITE: "business:write",
  CUSTOMERS_READ: "customers:read",
  CUSTOMERS_WRITE: "customers:write",
  ORDERS_READ: "orders:read",
  ORDERS_WRITE: "orders:write",
  MENU_READ: "menu:read",
  MENU_WRITE: "menu:write",
  INVENTORY_READ: "inventory:read",
  INVENTORY_WRITE: "inventory:write",
  STAFF_READ: "staff:read",
  STAFF_WRITE: "staff:write",
  RESERVATIONS_READ: "reservations:read",
  RESERVATIONS_WRITE: "reservations:write",
  ANALYTICS_READ: "analytics:read",
  AI_READ: "ai:read",
  AI_EXECUTE: "ai:execute",
  AUTOMATION_READ: "automation:read",
  AUTOMATION_EXECUTE: "automation:execute",
  WEBHOOKS_MANAGE: "webhooks:manage",
} as const;

export type PlatformApiScope =
  (typeof PLATFORM_API_SCOPES)[keyof typeof PLATFORM_API_SCOPES];

export const ALL_PLATFORM_API_SCOPES: PlatformApiScope[] = Object.values(PLATFORM_API_SCOPES);

export const PLATFORM_API_SCOPE_GROUPS = {
  readOnly: [
    PLATFORM_API_SCOPES.BUSINESS_READ,
    PLATFORM_API_SCOPES.CUSTOMERS_READ,
    PLATFORM_API_SCOPES.ORDERS_READ,
    PLATFORM_API_SCOPES.MENU_READ,
    PLATFORM_API_SCOPES.RESERVATIONS_READ,
    PLATFORM_API_SCOPES.ANALYTICS_READ,
  ],
  operations: [
    PLATFORM_API_SCOPES.ORDERS_READ,
    PLATFORM_API_SCOPES.ORDERS_WRITE,
    PLATFORM_API_SCOPES.MENU_READ,
    PLATFORM_API_SCOPES.CUSTOMERS_READ,
    PLATFORM_API_SCOPES.CUSTOMERS_WRITE,
  ],
  full: ALL_PLATFORM_API_SCOPES,
} as const;

export function hasRequiredScopes(granted: string[], required: string[]): boolean {
  const grantedSet = new Set(granted);
  return required.every((scope) => grantedSet.has(scope));
}

export function normalizeApiScopes(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}
