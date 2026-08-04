import type { InventoryStockStatus } from "@/modules/inventory/constants/inventory-status";
import type { InventoryRecord, InventoryStock } from "@/modules/inventory/types/inventory-platform";

export function getInventoryItemSummary(record: InventoryRecord): string {
  const stock = getPrimaryStock(record);
  return `${record.item.name} (${record.item.sku}) — ${stock?.quantityOnHand ?? 0} ${record.unit.abbreviation}`;
}

export function getInventoryItemLabel(record: InventoryRecord): string {
  return record.item.name;
}

export function getPrimaryStock(record: InventoryRecord): InventoryStock | null {
  return record.stocks[0] ?? null;
}

export function getTotalQuantityAcrossLocations(record: InventoryRecord): number {
  return record.stocks.reduce((sum, stock) => sum + stock.quantityOnHand, 0);
}

export function isLowStock(record: InventoryRecord): boolean {
  return record.stocks.some((s) => s.quantityOnHand <= record.item.reorderPoint);
}

export function isOutOfStock(record: InventoryRecord): boolean {
  return record.item.status === "out_of_stock";
}

export function isExpiringSoon(record: InventoryRecord, withinDays = 3): boolean {
  const cutoff = Date.now() + withinDays * 86_400_000;
  return record.expiryTracking.some((e) => new Date(e.expiresAt).getTime() <= cutoff);
}

export function getStockStatusSeverity(
  status: InventoryStockStatus,
): "ok" | "warning" | "critical" {
  switch (status) {
    case "low_stock":
      return "warning";
    case "out_of_stock":
    case "expired":
    case "damaged":
      return "critical";
    default:
      return "ok";
  }
}

export function formatCurrency(cents: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(cents / 100);
}

export function getTotalWasteCost(record: InventoryRecord): number {
  return record.wasteRecords.reduce((sum, w) => sum + w.costCents, 0);
}

export function getDaysOfSupply(record: InventoryRecord): number {
  return record.analytics.daysOfSupply;
}

export function hasRecipeMapping(record: InventoryRecord): boolean {
  return record.recipeMappings.length > 0;
}

export function getSuggestedReorderQuantity(record: InventoryRecord): number {
  return record.aiContext.suggestedReorderQuantity || record.item.reorderQuantity;
}
