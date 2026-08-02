import type {
  RestaurantBrandingInput,
  RestaurantPreferencesInput,
  RestaurantSettingsInput,
} from "@/modules/restaurant-management/types/restaurant-management-types";

const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const URL_PATTERN = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/i;

export function validateRestaurantSettingsInput(input: RestaurantSettingsInput): void {
  if (
    input.defaultCurrency?.trim() &&
    !CURRENCY_PATTERN.test(input.defaultCurrency.trim().toUpperCase())
  ) {
    throw new Error("Currency must be a 3-letter ISO code (e.g. GBP)");
  }

  if (input.defaultTaxRate != null && (input.defaultTaxRate < 0 || input.defaultTaxRate > 100)) {
    throw new Error("Tax rate must be between 0 and 100");
  }

  if (
    input.serviceChargePercentage != null &&
    (input.serviceChargePercentage < 0 || input.serviceChargePercentage > 100)
  ) {
    throw new Error("Service charge must be between 0 and 100 percent");
  }

  if (input.reservationIntervalMinutes != null && input.reservationIntervalMinutes < 5) {
    throw new Error("Reservation interval must be at least 5 minutes");
  }

  if (input.reservationBufferMinutes != null && input.reservationBufferMinutes < 0) {
    throw new Error("Reservation buffer cannot be negative");
  }
}

export function validateRestaurantBrandingInput(input: RestaurantBrandingInput): void {
  if (input.primaryColor?.trim() && !HEX_COLOR_PATTERN.test(input.primaryColor.trim())) {
    throw new Error("Primary color must be a valid hex code (e.g. #2563EB)");
  }

  if (input.secondaryColor?.trim() && !HEX_COLOR_PATTERN.test(input.secondaryColor.trim())) {
    throw new Error("Secondary color must be a valid hex code (e.g. #F97316)");
  }

  if (input.website?.trim() && !URL_PATTERN.test(input.website.trim())) {
    throw new Error("Enter a valid website URL");
  }
}

export function validateRestaurantPreferencesInput(input: RestaurantPreferencesInput): void {
  validateRestaurantSettingsInput(input);
}
