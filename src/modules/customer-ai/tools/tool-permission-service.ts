import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { resolveScopePreview } from "@/services/settings-engine.service";
import { ensureBootstrapSettingsEngine } from "@/modules/settings-engine/plugins/bootstrap-settings";
import type { CustomerAiCapabilities } from "@/modules/customer-ai/types/customer-ai.types";
import type { AiOperationsCapabilities } from "@/modules/customer-ai/types/customer-ai.types";
import type { AiPermissionKey } from "@/modules/customer-ai/tools/tool-types";

const PERMISSION_DEFAULTS: Record<AiPermissionKey, boolean> = {
  "ai.customer.read": true,
  "ai.customer.write": false,
  "ai.orders.read": true,
  "ai.orders.create": false,
  "ai.orders.update": false,
  "ai.orders.cancel": false,
  "ai.reservations.read": true,
  "ai.reservations.create": true,
  "ai.reservations.update": false,
  "ai.reservations.cancel": false,
  "ai.products.read": true,
  "ai.inventory.read": false,
  "ai.analytics.read": false,
  "ai.communication.send": false,
  "ai.business.write": false,
};

const PERMISSION_SETTING_KEYS: Record<AiPermissionKey, string> = {
  "ai.customer.read": "ai.ops.customer.read",
  "ai.customer.write": "ai.ops.customer.write",
  "ai.orders.read": "ai.ops.orders.read",
  "ai.orders.create": "ai.ops.orders.create",
  "ai.orders.update": "ai.ops.orders.update",
  "ai.orders.cancel": "ai.ops.orders.cancel",
  "ai.reservations.read": "ai.ops.reservations.read",
  "ai.reservations.create": "ai.ops.reservations.create",
  "ai.reservations.update": "ai.ops.reservations.update",
  "ai.reservations.cancel": "ai.ops.reservations.cancel",
  "ai.products.read": "ai.ops.products.read",
  "ai.inventory.read": "ai.ops.inventory.read",
  "ai.analytics.read": "ai.ops.analytics.read",
  "ai.communication.send": "ai.ops.communication.send",
  "ai.business.write": "ai.ops.business.write",
};

async function resolvePermission(
  platform: BusinessContext,
  key: AiPermissionKey,
): Promise<boolean> {
  ensureBootstrapSettingsEngine();
  const preview = await resolveScopePreview(platform, PERMISSION_SETTING_KEYS[key], ["BUSINESS"]);
  const value = preview[0]?.value;
  if (typeof value === "boolean") return value;
  return PERMISSION_DEFAULTS[key];
}

export async function getAiOperationsPermissions(
  platform: BusinessContext,
): Promise<Record<AiPermissionKey, boolean>> {
  const entries = await Promise.all(
    (Object.keys(PERMISSION_SETTING_KEYS) as AiPermissionKey[]).map(async (key) => [
      key,
      await resolvePermission(platform, key),
    ]),
  );
  return Object.fromEntries(entries) as Record<AiPermissionKey, boolean>;
}

export function permissionsFromCustomerCapabilities(
  capabilities: CustomerAiCapabilities,
): Record<AiPermissionKey, boolean> {
  return {
    "ai.customer.read": true,
    "ai.customer.write": false,
    "ai.orders.read": capabilities.readOrders,
    "ai.orders.create": capabilities.createOrder,
    "ai.orders.update": false,
    "ai.orders.cancel": capabilities.readOrders,
    "ai.reservations.read": capabilities.readReservations,
    "ai.reservations.create": capabilities.createReservation,
    "ai.reservations.update": false,
    "ai.reservations.cancel": capabilities.readReservations,
    "ai.products.read": capabilities.readMenu,
    "ai.inventory.read": false,
    "ai.analytics.read": false,
    "ai.communication.send": false,
    "ai.business.write": false,
  };
}

export function permissionsForOwner(): Record<AiPermissionKey, boolean> {
  return {
    "ai.customer.read": true,
    "ai.customer.write": true,
    "ai.orders.read": true,
    "ai.orders.create": true,
    "ai.orders.update": true,
    "ai.orders.cancel": true,
    "ai.reservations.read": true,
    "ai.reservations.create": true,
    "ai.reservations.update": true,
    "ai.reservations.cancel": true,
    "ai.products.read": true,
    "ai.inventory.read": true,
    "ai.analytics.read": true,
    "ai.communication.send": true,
    "ai.business.write": true,
  };
}

export function hasToolPermission(
  permissions: Record<AiPermissionKey, boolean>,
  permission: AiPermissionKey,
): boolean {
  return Boolean(permissions[permission]);
}

export async function getAiOperationsCapabilities(
  platform: BusinessContext,
): Promise<AiOperationsCapabilities> {
  const permissions = await getAiOperationsPermissions(platform);
  const customer = await import("@/modules/customer-ai/services/customer-ai-settings.service").then(
    (m) => m.getCustomerAiCapabilities(platform),
  );

  return {
    ...customer,
    permissions,
    ordersCancel: permissions["ai.orders.cancel"],
    ordersCreate: permissions["ai.orders.create"],
    reservationsCancel: permissions["ai.reservations.cancel"],
    reservationsUpdate: permissions["ai.reservations.update"],
    inventoryRead: permissions["ai.inventory.read"],
    analyticsRead: permissions["ai.analytics.read"],
    destructiveActionsEnabled: permissions["ai.orders.cancel"] || permissions["ai.reservations.cancel"],
  };
}

export async function updateAiOperationsCapabilities(
  platform: BusinessContext,
  input: Partial<AiOperationsCapabilities>,
): Promise<AiOperationsCapabilities> {
  const { setConfigurationValue, ensureSettingsEngineDefaults } = await import(
    "@/services/settings-engine.service"
  );
  const { updateCustomerAiCapabilities } = await import(
    "@/modules/customer-ai/services/customer-ai-settings.service"
  );

  await ensureSettingsEngineDefaults(platform.business.id);

  await updateCustomerAiCapabilities(platform, input);

  const permissionUpdates: Array<[keyof AiOperationsCapabilities, AiPermissionKey]> = [
    ["ordersCancel", "ai.orders.cancel"],
    ["ordersCreate", "ai.orders.create"],
    ["reservationsCancel", "ai.reservations.cancel"],
    ["reservationsUpdate", "ai.reservations.update"],
    ["inventoryRead", "ai.inventory.read"],
    ["analyticsRead", "ai.analytics.read"],
  ];

  for (const [field, permission] of permissionUpdates) {
    if (input[field] !== undefined) {
      await setConfigurationValue(platform, {
        key: PERMISSION_SETTING_KEYS[permission],
        value: input[field],
        scope: "BUSINESS",
      });
    }
  }

  if (input.ordersCreate !== undefined && input.createOrder === undefined) {
    await updateCustomerAiCapabilities(platform, { createOrder: input.ordersCreate });
  } else if (input.createOrder !== undefined && input.ordersCreate === undefined) {
    await setConfigurationValue(platform, {
      key: PERMISSION_SETTING_KEYS["ai.orders.create"],
      value: input.createOrder,
      scope: "BUSINESS",
    });
  }

  return getAiOperationsCapabilities(platform);
}
