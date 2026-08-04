import type { ExpiryTracking } from "@/modules/inventory/types/inventory-platform";

export function getDaysUntilExpiry(expiresAt: string, nowMs = Date.now()): number {
  const expiry = new Date(expiresAt).getTime();
  return Math.ceil((expiry - nowMs) / 86_400_000);
}

export function getExpiryStatus(
  expiresAt: string,
  warningDays = 3,
  nowMs = Date.now(),
): ExpiryTracking["status"] {
  const days = getDaysUntilExpiry(expiresAt, nowMs);

  if (days < 0) {
    return "expired";
  }

  if (days <= warningDays) {
    return "approaching";
  }

  return "ok";
}

export function formatExpiryLabel(expiresAt: string): string {
  const days = getDaysUntilExpiry(expiresAt);

  if (days < 0) {
    return `Expired ${Math.abs(days)} day(s) ago`;
  }

  if (days === 0) {
    return "Expires today";
  }

  if (days === 1) {
    return "Expires tomorrow";
  }

  return `Expires in ${days} days`;
}

export function sortByExpiryAsc(items: ExpiryTracking[]): ExpiryTracking[] {
  return [...items].sort(
    (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
  );
}

export function filterExpiringWithin(
  items: ExpiryTracking[],
  withinDays: number,
): ExpiryTracking[] {
  const cutoff = Date.now() + withinDays * 86_400_000;

  return items.filter((item) => new Date(item.expiresAt).getTime() <= cutoff);
}

export function calculateWasteRateBps(wasteQuantity: number, totalQuantity: number): number {
  if (totalQuantity <= 0) {
    return 0;
  }

  return Math.round((wasteQuantity / totalQuantity) * 10000);
}
