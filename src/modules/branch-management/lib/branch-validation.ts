import type { BranchManagementInput } from "@/modules/branch-management/types/branch-management-types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+]?[\d\s().-]{7,20}$/;
const WEBSITE_PATTERN = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/i;
const BRANCH_CODE_PATTERN = /^[A-Z0-9][A-Z0-9-_]{1,31}$/;

export function normalizeBranchCode(code: string): string {
  return code.trim().toUpperCase();
}

export function slugifyBranchCode(name: string): string {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);

  return base || "BRANCH";
}

export function validateBranchInput(input: BranchManagementInput): void {
  if (!input.name.trim()) {
    throw new Error("Branch name is required");
  }

  if (!input.code.trim()) {
    throw new Error("Branch code is required");
  }

  if (!BRANCH_CODE_PATTERN.test(normalizeBranchCode(input.code))) {
    throw new Error(
      "Branch code must be 2-32 characters using letters, numbers, hyphens, or underscores",
    );
  }

  if (!input.addressLine1.trim()) {
    throw new Error("Address line 1 is required");
  }

  if (!input.city.trim()) {
    throw new Error("City is required");
  }

  if (!input.country.trim()) {
    throw new Error("Country is required");
  }

  if (!input.timezone.trim()) {
    throw new Error("Timezone is required");
  }

  if (input.email?.trim() && !EMAIL_PATTERN.test(input.email.trim())) {
    throw new Error("Enter a valid email address");
  }

  if (input.phone?.trim() && !PHONE_PATTERN.test(input.phone.trim())) {
    throw new Error("Enter a valid phone number");
  }

  if (input.website?.trim() && !WEBSITE_PATTERN.test(input.website.trim())) {
    throw new Error("Enter a valid website URL");
  }

  if (input.latitude != null && (input.latitude < -90 || input.latitude > 90)) {
    throw new Error("Latitude must be between -90 and 90");
  }

  if (input.longitude != null && (input.longitude < -180 || input.longitude > 180)) {
    throw new Error("Longitude must be between -180 and 180");
  }
}

export function validateBranchSettings(settings: Record<string, unknown>): void {
  if (settings == null || typeof settings !== "object" || Array.isArray(settings)) {
    throw new Error("Branch settings must be a JSON object");
  }
}
