import type { ClientQRCode } from "@/modules/qr-menu/lib/qr-menu-utils";
import type { CreateQRCodeInput, UpdateQRCodeInput } from "@/services/qr-menu.service";

export interface QRCodeFormState {
  slug: string;
  tableId: string;
  isActive: boolean;
}

export interface QRCodeFormErrors {
  slug?: string;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createEmptyQRCodeForm(): QRCodeFormState {
  return {
    slug: "",
    tableId: "",
    isActive: true,
  };
}

export function validateQRCodeForm(form: QRCodeFormState): QRCodeFormErrors {
  const errors: QRCodeFormErrors = {};
  const slug = form.slug.trim().toLowerCase();

  if (!slug) {
    errors.slug = "Slug is required";
  } else if (!SLUG_PATTERN.test(slug)) {
    errors.slug = "Use lowercase letters, numbers, and hyphens only";
  }

  return errors;
}

export function buildCreateQRCodePayload(form: QRCodeFormState): CreateQRCodeInput {
  return {
    slug: form.slug.trim().toLowerCase(),
    tableId: form.tableId || null,
    isActive: form.isActive,
  };
}

export function buildUpdateQRCodePayload(form: QRCodeFormState): UpdateQRCodeInput {
  return {
    slug: form.slug.trim().toLowerCase(),
    tableId: form.tableId || null,
    isActive: form.isActive,
  };
}

export function qrCodeToFormState(qrCode: ClientQRCode): QRCodeFormState {
  return {
    slug: qrCode.slug,
    tableId: qrCode.tableId ?? "",
    isActive: qrCode.isActive,
  };
}

export const QR_MENU_SELECT_CLASSNAME =
  "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";
