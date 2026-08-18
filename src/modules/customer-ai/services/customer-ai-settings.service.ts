import "server-only";

import { ensureBootstrapSettingsEngine } from "@/modules/settings-engine/plugins/bootstrap-settings";
import { listSettingDefinitionsByModule } from "@/modules/settings-engine/registry/settings-registry";
import { resolveScopePreview } from "@/services/settings-engine.service";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import {
  CUSTOMER_AI_SETTINGS_KEYS,
} from "@/modules/customer-ai/constants/customer-ai.constants";
import type { CustomerAiCapabilities } from "@/modules/customer-ai/types/customer-ai.types";

async function resolveSetting(
  platform: BusinessContext,
  key: string,
  fallback: unknown,
): Promise<unknown> {
  ensureBootstrapSettingsEngine();
  const preview = await resolveScopePreview(platform, key, ["BUSINESS"]);
  return preview[0]?.value ?? fallback;
}

export async function getCustomerAiCapabilities(
  platform: BusinessContext,
): Promise<CustomerAiCapabilities> {
  const [
    enabled,
    readMenu,
    readHours,
    readReservations,
    readOrders,
    createReservation,
    createOrder,
    requireConfirmation,
  ] = await Promise.all([
    resolveSetting(platform, "ai.customer.enabled", true),
    resolveSetting(platform, "ai.customer.read_menu", true),
    resolveSetting(platform, "ai.customer.read_hours", true),
    resolveSetting(platform, "ai.customer.read_reservations", true),
    resolveSetting(platform, "ai.customer.read_orders", true),
    resolveSetting(platform, "ai.customer.create_reservation", true),
    resolveSetting(platform, "ai.customer.create_order", false),
    resolveSetting(platform, "ai.customer.require_confirmation", true),
  ]);

  return {
    enabled: Boolean(enabled),
    readMenu: Boolean(readMenu),
    readHours: Boolean(readHours),
    readReservations: Boolean(readReservations),
    readOrders: Boolean(readOrders),
    createReservation: Boolean(createReservation),
    createOrder: Boolean(createOrder),
    requireConfirmation: Boolean(requireConfirmation),
  };
}

export async function getCustomerAiCapabilitiesByBusinessId(
  businessId: string,
): Promise<CustomerAiCapabilities> {
  const business = await import("@/lib/prisma").then(({ prisma }) =>
    prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: { ownerId: true },
    }),
  );
  const { resolveBusinessContextFromModule } = await import("@/services/ai-engine-context.service");
  const platform = await resolveBusinessContextFromModule({
    businessId,
    userId: business.ownerId,
  });
  return getCustomerAiCapabilities(platform);
}

export function listCustomerAiSettingKeys(): readonly string[] {
  return CUSTOMER_AI_SETTINGS_KEYS;
}

export async function updateCustomerAiCapabilities(
  platform: BusinessContext,
  input: Partial<CustomerAiCapabilities>,
): Promise<CustomerAiCapabilities> {
  const { setConfigurationValue } = await import("@/services/settings-engine.service");

  const entries: Array<[keyof CustomerAiCapabilities, string]> = [
    ["enabled", "ai.customer.enabled"],
    ["readMenu", "ai.customer.read_menu"],
    ["readHours", "ai.customer.read_hours"],
    ["readReservations", "ai.customer.read_reservations"],
    ["readOrders", "ai.customer.read_orders"],
    ["createReservation", "ai.customer.create_reservation"],
    ["createOrder", "ai.customer.create_order"],
    ["requireConfirmation", "ai.customer.require_confirmation"],
  ];

  for (const [field, key] of entries) {
    if (input[field] !== undefined) {
      await setConfigurationValue(platform, {
        key,
        value: input[field],
        scope: "BUSINESS",
      });
    }
  }

  return getCustomerAiCapabilities(platform);
}
