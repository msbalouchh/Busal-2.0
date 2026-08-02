import type { CategoryStatus } from "@prisma/client";

import type { CategoryManagementInput } from "@/modules/category-management/types/category-management-types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeCategoryName(name: string): string {
  return name.trim();
}

export function slugifyCategoryName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return base || "category";
}

export function normalizeCategorySlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function validateCategoryInput(input: CategoryManagementInput): void {
  if (!normalizeCategoryName(input.name)) {
    throw new Error("Category name is required");
  }

  if (input.name.trim().length > 120) {
    throw new Error("Category name must be 120 characters or fewer");
  }

  if (input.description && input.description.length > 2000) {
    throw new Error("Description must be 2000 characters or fewer");
  }

  if (input.slug?.trim() && !SLUG_PATTERN.test(normalizeCategorySlug(input.slug))) {
    throw new Error("Slug must use lowercase letters, numbers, and hyphens");
  }

  if (input.seoTitle && input.seoTitle.length > 120) {
    throw new Error("SEO title must be 120 characters or fewer");
  }

  if (input.seoDescription && input.seoDescription.length > 320) {
    throw new Error("SEO description must be 320 characters or fewer");
  }

  if (
    input.displayOrder != null &&
    (!Number.isInteger(input.displayOrder) || input.displayOrder < 0)
  ) {
    throw new Error("Display order must be a non-negative integer");
  }
}

export function validateCategoryStatusTransition(
  currentStatus: CategoryStatus,
  nextStatus: CategoryStatus,
): void {
  if (currentStatus === nextStatus) {
    return;
  }

  if (currentStatus === "ARCHIVED" && nextStatus !== "INACTIVE" && nextStatus !== "ACTIVE") {
    throw new Error("Archived categories can only be restored to active or inactive");
  }
}

export function buildDuplicateCategoryName(name: string): string {
  const base = name.trim();
  const suffix = " (Copy)";
  const maxLength = 120;

  if (base.length + suffix.length <= maxLength) {
    return `${base}${suffix}`;
  }

  return `${base.slice(0, maxLength - suffix.length)}${suffix}`;
}

export function buildDuplicateCategorySlug(slug: string): string {
  const base = slug.trim().toLowerCase();
  const suffix = "-copy";
  const maxLength = 80;

  if (base.length + suffix.length <= maxLength) {
    return `${base}${suffix}`;
  }

  return `${base.slice(0, maxLength - suffix.length)}${suffix}`;
}
