import type { CustomerStatus, LoyaltyTier, LoyaltyTransactionType, Prisma } from "@prisma/client";

import type {
  CustomerAddressInput,
  CustomerCrmRecord,
  CustomerImportRow,
  CustomerListQuery,
  CustomerRegistrationInput,
  CustomerTimelineItem,
  DuplicateCustomerMatch,
} from "@/modules/customer-crm-management/types/customer-crm-types";

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildFullName(firstName?: string | null, lastName?: string | null): string {
  return [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");
}

export function resolveDisplayName(input: {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string;
}): string {
  return (
    input.fullName?.trim() ||
    buildFullName(input.firstName, input.lastName) ||
    input.name?.trim() ||
    "Customer"
  );
}

export function validateCustomerEmail(email: string | null | undefined): void {
  if (!email?.trim()) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new Error("Invalid email address");
  }
}

export function validateCustomerPhone(phone: string | null | undefined): void {
  if (!phone?.trim()) return;
  if (phone.trim().length < 6) {
    throw new Error("Phone number is too short");
  }
}

export function validateCustomerRegistration(input: CustomerRegistrationInput): void {
  const displayName = resolveDisplayName(input);
  if (!displayName) {
    throw new Error("Customer name is required");
  }
  validateCustomerEmail(input.email);
  validateCustomerPhone(input.phone);
}

export function validateCustomerAddress(input: CustomerAddressInput): void {
  if (!input.addressLine1?.trim()) {
    throw new Error("Address line 1 is required");
  }
}

export function validateLoyaltyPoints(points: number): void {
  if (!Number.isInteger(points) || points === 0) {
    throw new Error("Points must be a non-zero integer");
  }
}

export function calculateTierFromLifetimePoints(lifetimePoints: number): LoyaltyTier {
  if (lifetimePoints >= 10_000) return "VIP";
  if (lifetimePoints >= 5_000) return "PLATINUM";
  if (lifetimePoints >= 2_000) return "GOLD";
  if (lifetimePoints >= 500) return "SILVER";
  return "BRONZE";
}

export const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 2000,
  PLATINUM: 5000,
  VIP: 10000,
};

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  BLOCKED: "Blocked",
  ARCHIVED: "Archived",
};

export const LOYALTY_TIER_LABELS: Record<LoyaltyTier, string> = {
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
  VIP: "VIP",
};

export const LOYALTY_TRANSACTION_LABELS: Record<LoyaltyTransactionType, string> = {
  EARN: "Earned",
  REDEEM: "Redeemed",
  ADJUSTMENT: "Adjustment",
  EXPIRE: "Expired",
};

export function buildCustomerListWhere(
  businessId: string,
  query: CustomerListQuery,
): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = {
    businessId,
    deletedAt: null,
  };

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  }

  if (query.tag?.trim()) {
    where.tags = { has: query.tag.trim() };
  }

  if (query.search?.trim()) {
    const search = query.search.trim();
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { fullName: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { customerCode: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

export function serializeImportRow(row: CustomerImportRow): CustomerRegistrationInput {
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    tags: row.tags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    notes: row.notes,
    marketingConsent: row.marketingConsent?.toLowerCase() === "yes",
  };
}

export type { CustomerCrmRecord, CustomerTimelineItem, DuplicateCustomerMatch };
