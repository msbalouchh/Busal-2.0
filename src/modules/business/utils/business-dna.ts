import type { BusinessDna } from "@/types/business-profile";

import type {
  BusinessAddress,
  BusinessBrandingAssets,
  BusinessOperationalSettings,
  BusinessRegionalSettings,
  BusinessSocialLinks,
} from "@/modules/business/types/business-profile-types";

function readString(dna: BusinessDna, key: string, fallback = ""): string {
  const value = dna[key];
  return typeof value === "string" ? value : fallback;
}

function readNullableString(dna: BusinessDna, key: string): string | null {
  const value = dna[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function parseBusinessAddress(dna: BusinessDna, countryFallback = ""): BusinessAddress {
  const address =
    dna.address && typeof dna.address === "object" && !Array.isArray(dna.address)
      ? (dna.address as Record<string, unknown>)
      : {};

  return {
    country: readString(address, "country", countryFallback),
    addressLine1: readString(address, "addressLine1"),
    addressLine2: readString(address, "addressLine2"),
    city: readString(address, "city"),
    state: readString(address, "state"),
    postalCode: readString(address, "postalCode"),
    mapsLocation: readNullableString(address, "mapsLocation"),
  };
}

export function parseSocialLinks(dna: BusinessDna): BusinessSocialLinks {
  const links =
    dna.socialLinks && typeof dna.socialLinks === "object" && !Array.isArray(dna.socialLinks)
      ? (dna.socialLinks as Record<string, unknown>)
      : {};

  return {
    facebook: readString(links, "facebook"),
    instagram: readString(links, "instagram"),
    twitter: readString(links, "twitter"),
    linkedin: readString(links, "linkedin"),
    tiktok: readString(links, "tiktok"),
    youtube: readString(links, "youtube"),
  };
}

export function parseBrandingAssets(
  dna: BusinessDna,
  settings: Partial<Record<string, unknown>>,
): BusinessBrandingAssets {
  return {
    logoFileId: readNullableString(dna, "logoFileId"),
    logoUrl: readNullableString(dna, "logoUrl"),
    coverFileId: readNullableString(dna, "coverFileId"),
    coverUrl: readNullableString(dna, "coverUrl"),
    faviconFileId: readNullableString(dna, "faviconFileId"),
    faviconUrl: readNullableString(dna, "faviconUrl"),
    primaryColor: typeof settings.primaryColor === "string" ? settings.primaryColor : "#2563eb",
    secondaryColor:
      typeof settings.secondaryColor === "string" ? settings.secondaryColor : "#64748b",
  };
}

export function parseRegionalSettings(
  businessTimezone: string | null,
  settings: Partial<Record<string, unknown>>,
): BusinessRegionalSettings {
  return {
    timezone:
      typeof settings.timezone === "string" ? settings.timezone : businessTimezone?.trim() || "UTC",
    currency: typeof settings.currency === "string" ? settings.currency : "GBP",
    language: typeof settings.language === "string" ? settings.language : "en-GB",
    dateFormat: typeof settings.dateFormat === "string" ? settings.dateFormat : "DD/MM/YYYY",
    timeFormat: typeof settings.timeFormat === "string" ? settings.timeFormat : "24h",
    weekStart: typeof settings.weekStart === "string" ? settings.weekStart : "monday",
  };
}

export function parseOperationalSettings(
  settings: Partial<Record<string, unknown>>,
): BusinessOperationalSettings {
  return {
    businessStatus:
      typeof settings.businessStatus === "string" ? settings.businessStatus : "active",
    autoConfirmOrders: settings.autoConfirmOrders === true,
    allowOnlineOrdering: settings.allowOnlineOrdering !== false,
    requireStaffPin: settings.requireStaffPin === true,
  };
}

export function mergeBusinessDna(
  existing: BusinessDna,
  patch: Record<string, unknown>,
): BusinessDna {
  return { ...existing, ...patch };
}

export function buildAssetUrl(fileId: string): string {
  return `/api/platform-files/${fileId}`;
}
