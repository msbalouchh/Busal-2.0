import type { ProductStatus } from "@prisma/client";

import type { ProductManagementInput } from "@/modules/product-management/types/product-management-types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKU_PATTERN = /^[A-Z0-9][A-Z0-9-_]{1,48}$/i;

export function normalizeProductName(name: string): string {
  return name.trim();
}

export function normalizeProductSku(sku: string): string {
  return sku.trim().toUpperCase();
}

export function slugifyProductName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return base || "product";
}

export function normalizeProductSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
  );
}

export function validateProductInput(input: ProductManagementInput): void {
  if (!normalizeProductName(input.name)) {
    throw new Error("Product name is required");
  }

  if (!input.categoryId?.trim()) {
    throw new Error("Category is required");
  }

  if (!normalizeProductSku(input.sku)) {
    throw new Error("SKU is required");
  }

  if (!SKU_PATTERN.test(normalizeProductSku(input.sku))) {
    throw new Error("SKU must be 2-49 characters using letters, numbers, hyphens, or underscores");
  }

  if (input.price == null || Number.isNaN(input.price) || input.price < 0) {
    throw new Error("Price must be zero or greater");
  }

  if (input.costPrice != null && (Number.isNaN(input.costPrice) || input.costPrice < 0)) {
    throw new Error("Cost price must be zero or greater");
  }

  if (
    input.taxRate != null &&
    (Number.isNaN(input.taxRate) || input.taxRate < 0 || input.taxRate > 100)
  ) {
    throw new Error("Tax rate must be between 0 and 100");
  }

  if (
    input.preparationTime != null &&
    (!Number.isInteger(input.preparationTime) || input.preparationTime < 0)
  ) {
    throw new Error("Preparation time must be a non-negative integer");
  }

  if (input.calories != null && (!Number.isInteger(input.calories) || input.calories < 0)) {
    throw new Error("Calories must be a non-negative integer");
  }

  if (input.slug?.trim() && !SLUG_PATTERN.test(normalizeProductSlug(input.slug))) {
    throw new Error("Slug must use lowercase letters, numbers, and hyphens");
  }

  if (
    input.displayOrder != null &&
    (!Number.isInteger(input.displayOrder) || input.displayOrder < 0)
  ) {
    throw new Error("Display order must be a non-negative integer");
  }
}

export function validateProductStatusTransition(
  currentStatus: ProductStatus,
  nextStatus: ProductStatus,
): void {
  if (currentStatus === nextStatus) {
    return;
  }

  if (currentStatus === "ARCHIVED" && nextStatus !== "INACTIVE" && nextStatus !== "ACTIVE") {
    throw new Error("Archived products can only be restored to active or inactive");
  }
}

export function buildDuplicateProductName(name: string): string {
  const base = name.trim();
  const suffix = " (Copy)";
  return base.length + suffix.length <= 120
    ? `${base}${suffix}`
    : `${base.slice(0, 120 - suffix.length)}${suffix}`;
}

export function buildDuplicateProductSku(sku: string): string {
  const base = normalizeProductSku(sku);
  const suffix = "-COPY";
  return base.length + suffix.length <= 49
    ? `${base}${suffix}`
    : `${base.slice(0, 49 - suffix.length)}${suffix}`;
}
