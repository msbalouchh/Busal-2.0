import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { RESTAURANT_MODULE_KEY } from "@/modules/restaurant-management/constants/routes";
import type {
  RestaurantBrandingInput,
  RestaurantBrandingRecord,
  RestaurantFoundationBundle,
  RestaurantFeatureToggleInput,
  RestaurantPreferencesInput,
  RestaurantSettingsInput,
  RestaurantSettingsRecord,
} from "@/modules/restaurant-management/types/restaurant-management-types";
import {
  validateRestaurantBrandingInput,
  validateRestaurantPreferencesInput,
  validateRestaurantSettingsInput,
} from "@/modules/restaurant-management/lib/restaurant-validation";
import { getBusinessModuleRecord } from "@/services/business-module.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

function decimalToNumber(value: Prisma.Decimal | null | undefined): number | null {
  return value == null ? null : Number(value);
}

function mapJsonSettings(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function serializeSettings(
  record: Prisma.RestaurantSettingsGetPayload<object>,
): RestaurantSettingsRecord {
  return {
    id: record.id,
    businessId: record.businessId,
    defaultBranchId: record.defaultBranchId,
    businessRegistrationNumber: record.businessRegistrationNumber,
    foodLicenseNumber: record.foodLicenseNumber,
    vatNumber: record.vatNumber,
    defaultCurrency: record.defaultCurrency,
    defaultTaxRate: decimalToNumber(record.defaultTaxRate),
    serviceChargeEnabled: record.serviceChargeEnabled,
    serviceChargePercentage: decimalToNumber(record.serviceChargePercentage),
    allowTakeaway: record.allowTakeaway,
    allowDelivery: record.allowDelivery,
    allowDineIn: record.allowDineIn,
    allowReservations: record.allowReservations,
    reservationIntervalMinutes: record.reservationIntervalMinutes,
    reservationBufferMinutes: record.reservationBufferMinutes,
    kitchenDisplayEnabled: record.kitchenDisplayEnabled,
    qrOrderingEnabled: record.qrOrderingEnabled,
    posEnabled: record.posEnabled,
    loyaltyEnabled: record.loyaltyEnabled,
    onlineOrderingEnabled: record.onlineOrderingEnabled,
    settings: mapJsonSettings(record.settings),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function serializeBranding(
  record: Prisma.RestaurantBrandingGetPayload<object>,
): RestaurantBrandingRecord {
  return {
    id: record.id,
    businessId: record.businessId,
    logo: record.logo,
    coverImage: record.coverImage,
    primaryColor: record.primaryColor,
    secondaryColor: record.secondaryColor,
    receiptFooter: record.receiptFooter,
    website: record.website,
    facebook: record.facebook,
    instagram: record.instagram,
    tiktok: record.tiktok,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function resolveBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function ensureRestaurantSettings(
  businessId: string,
): Promise<RestaurantSettingsRecord> {
  const existing = await prisma.restaurantSettings.findUnique({ where: { businessId } });

  if (existing) {
    return serializeSettings(existing);
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      currency: true,
      branches: { where: { isMain: true }, take: 1, select: { id: true } },
    },
  });

  const created = await prisma.restaurantSettings.create({
    data: {
      businessId,
      defaultCurrency: business?.currency ?? "GBP",
      defaultBranchId: business?.branches[0]?.id ?? null,
    },
  });

  return serializeSettings(created);
}

export async function ensureRestaurantBranding(
  businessId: string,
): Promise<RestaurantBrandingRecord> {
  const existing = await prisma.restaurantBranding.findUnique({ where: { businessId } });

  if (existing) {
    return serializeBranding(existing);
  }

  const created = await prisma.restaurantBranding.create({ data: { businessId } });
  return serializeBranding(created);
}

export async function getRestaurantFoundationBundle(
  ownerId: string,
): Promise<RestaurantFoundationBundle> {
  const businessId = await resolveBusinessId(ownerId);
  const [settings, branding, moduleRecord] = await Promise.all([
    ensureRestaurantSettings(businessId),
    ensureRestaurantBranding(businessId),
    getBusinessModuleRecord(businessId, RESTAURANT_MODULE_KEY),
  ]);

  return {
    settings,
    branding,
    moduleEnabled: moduleRecord?.isEnabled ?? false,
    moduleInstalled: moduleRecord != null,
  };
}

export async function updateRestaurantSettings(
  ownerId: string,
  input: RestaurantSettingsInput,
): Promise<RestaurantSettingsRecord> {
  validateRestaurantSettingsInput(input);
  const businessId = await resolveBusinessId(ownerId);
  await ensureRestaurantSettings(businessId);

  const updated = await prisma.restaurantSettings.update({
    where: { businessId },
    data: {
      defaultBranchId: input.defaultBranchId,
      businessRegistrationNumber: input.businessRegistrationNumber?.trim() || null,
      foodLicenseNumber: input.foodLicenseNumber?.trim() || null,
      vatNumber: input.vatNumber?.trim() || null,
      defaultCurrency: input.defaultCurrency?.trim().toUpperCase() || undefined,
      defaultTaxRate: input.defaultTaxRate ?? undefined,
      serviceChargeEnabled: input.serviceChargeEnabled,
      serviceChargePercentage: input.serviceChargePercentage ?? undefined,
      allowTakeaway: input.allowTakeaway,
      allowDelivery: input.allowDelivery,
      allowDineIn: input.allowDineIn,
      allowReservations: input.allowReservations,
      reservationIntervalMinutes: input.reservationIntervalMinutes,
      reservationBufferMinutes: input.reservationBufferMinutes,
      kitchenDisplayEnabled: input.kitchenDisplayEnabled,
      qrOrderingEnabled: input.qrOrderingEnabled,
      posEnabled: input.posEnabled,
      loyaltyEnabled: input.loyaltyEnabled,
      onlineOrderingEnabled: input.onlineOrderingEnabled,
      settings: input.settings as Prisma.InputJsonValue | undefined,
    },
  });

  return serializeSettings(updated);
}

export async function updateRestaurantBranding(
  ownerId: string,
  input: RestaurantBrandingInput,
): Promise<RestaurantBrandingRecord> {
  validateRestaurantBrandingInput(input);
  const businessId = await resolveBusinessId(ownerId);
  await ensureRestaurantBranding(businessId);

  const updated = await prisma.restaurantBranding.update({
    where: { businessId },
    data: {
      logo: input.logo?.trim() || null,
      coverImage: input.coverImage?.trim() || null,
      primaryColor: input.primaryColor?.trim() || null,
      secondaryColor: input.secondaryColor?.trim() || null,
      receiptFooter: input.receiptFooter?.trim() || null,
      website: input.website?.trim() || null,
      facebook: input.facebook?.trim() || null,
      instagram: input.instagram?.trim() || null,
      tiktok: input.tiktok?.trim() || null,
    },
  });

  return serializeBranding(updated);
}

export async function updateRestaurantPreferences(
  ownerId: string,
  input: RestaurantPreferencesInput,
): Promise<RestaurantSettingsRecord> {
  validateRestaurantPreferencesInput(input);
  return updateRestaurantSettings(ownerId, input);
}

export async function updateRestaurantFeatureToggles(
  ownerId: string,
  input: RestaurantFeatureToggleInput,
): Promise<RestaurantSettingsRecord> {
  return updateRestaurantSettings(ownerId, input);
}
