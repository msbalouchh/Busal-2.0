import {
  ALLOWED_IMAGE_MIME_TYPES,
  BUSINESS_STATUS_OPTIONS,
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  MAX_BUSINESS_ASSET_SIZE_BYTES,
  TIME_FORMAT_OPTIONS,
  TIMEZONE_OPTIONS,
  WEEK_START_OPTIONS,
} from "@/modules/business/constants/business-profile";
import type {
  BusinessAddressUpdateInput,
  BusinessAssetUploadInput,
  BusinessBrandingUpdateInput,
  BusinessProfileUpdateInput,
  BusinessSettingsUpdateInput,
} from "@/modules/business/types/business-profile-types";
import { BUSINESS_TYPE_OPTIONS } from "@/modules/onboarding/lib/business-interview-questions";

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function assertInList<T extends string>(
  value: string,
  options: ReadonlyArray<{ value: T }>,
  field: string,
): void {
  if (!options.some((option) => option.value === value)) {
    throw new Error(`Invalid ${field}`);
  }
}

export function validateBusinessProfileInput(input: BusinessProfileUpdateInput): void {
  if (!input.businessName.trim()) {
    throw new Error("Business name is required");
  }

  if (!input.businessType) {
    throw new Error("Business type is required");
  }

  if (!BUSINESS_TYPE_OPTIONS.some((option) => option.value === input.businessType)) {
    throw new Error("Invalid business type");
  }

  assertInList(input.currency, CURRENCY_OPTIONS, "currency");
  assertInList(input.language, LANGUAGE_OPTIONS, "language");
  assertInList(input.dateFormat, DATE_FORMAT_OPTIONS, "date format");
  assertInList(input.timeFormat, TIME_FORMAT_OPTIONS, "time format");
  assertInList(input.timezone, TIMEZONE_OPTIONS, "timezone");
}

export function validateBusinessAddressInput(input: BusinessAddressUpdateInput): void {
  if (!input.country.trim()) {
    throw new Error("Country is required");
  }

  if (!input.addressLine1.trim()) {
    throw new Error("Address line 1 is required");
  }

  if (!input.city.trim()) {
    throw new Error("City is required");
  }

  if (!input.postalCode.trim()) {
    throw new Error("Postal code is required");
  }
}

export function validateBusinessBrandingInput(input: BusinessBrandingUpdateInput): void {
  if (!HEX_COLOR_PATTERN.test(input.primaryColor)) {
    throw new Error("Primary colour must be a valid hex code");
  }

  if (!HEX_COLOR_PATTERN.test(input.secondaryColor)) {
    throw new Error("Secondary colour must be a valid hex code");
  }
}

export function validateBusinessSettingsInput(input: BusinessSettingsUpdateInput): void {
  assertInList(input.weekStart, WEEK_START_OPTIONS, "week start");
  assertInList(input.businessStatus, BUSINESS_STATUS_OPTIONS, "business status");
}

export function validateBusinessAssetUpload(input: BusinessAssetUploadInput): void {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(input.mimeType)) {
    throw new Error("Unsupported image type. Use PNG, JPEG, WebP, or SVG.");
  }

  const buffer = Buffer.from(input.contentBase64, "base64");

  if (buffer.length === 0) {
    throw new Error("File is empty");
  }

  if (buffer.length > MAX_BUSINESS_ASSET_SIZE_BYTES) {
    throw new Error("File exceeds the 5 MB limit");
  }
}

export function validateEmail(value: string, field: string): void {
  if (value.trim() && !EMAIL_PATTERN.test(value.trim())) {
    throw new Error(`Invalid ${field}`);
  }
}

export function validateBranchName(
  name: string,
  existingNames: string[],
  currentName?: string,
): void {
  const normalized = name.trim().toLowerCase();

  if (!normalized) {
    throw new Error("Branch name is required");
  }

  const duplicate = existingNames.some(
    (existing) =>
      existing.trim().toLowerCase() === normalized &&
      existing.trim().toLowerCase() !== currentName?.trim().toLowerCase(),
  );

  if (duplicate) {
    throw new Error("A branch with this name already exists");
  }
}
