import type { MarketplaceLicenseType } from "@prisma/client";

export function resolveLicenseExpiry(
  licenseType: MarketplaceLicenseType,
  from: Date = new Date(),
): Date | null {
  const expires = new Date(from);

  switch (licenseType) {
    case "FREE":
    case "LIFETIME":
    case "ENTERPRISE":
      return null;
    case "TRIAL":
      expires.setDate(expires.getDate() + 14);
      return expires;
    case "MONTHLY":
      expires.setMonth(expires.getMonth() + 1);
      return expires;
    case "ANNUAL":
      expires.setFullYear(expires.getFullYear() + 1);
      return expires;
    default:
      return null;
  }
}

export function isLicenseActive(expiresAt: Date | null, now: Date = new Date()): boolean {
  if (!expiresAt) {
    return true;
  }

  return expiresAt > now;
}

export function calculateRevenueSplit(
  amountCents: number,
  commissionRate: number,
): { commissionCents: number; revenueShareCents: number } {
  const commissionCents = Math.round(amountCents * commissionRate);
  const revenueShareCents = amountCents - commissionCents;

  return { commissionCents, revenueShareCents };
}
