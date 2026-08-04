import type { InventoryRecord } from "@/modules/inventory/types/inventory-platform";

export interface StockDeductionInput {
  menuItemId: string;
  quantitySold: number;
}

export interface StockDeductionResult {
  itemId: string;
  itemName: string;
  quantityDeducted: number;
  unitAbbreviation: string;
}

/** Calculates ingredient deductions from recipe mappings (mock auto-deduction). */
export function calculateRecipeDeductions(
  records: InventoryRecord[],
  input: StockDeductionInput,
): StockDeductionResult[] {
  const results: StockDeductionResult[] = [];

  for (const record of records) {
    for (const mapping of record.recipeMappings) {
      if (mapping.menuItemId !== input.menuItemId || !mapping.isActive) {
        continue;
      }

      const baseQty = mapping.quantityRequired * input.quantitySold;
      const wastageMultiplier = 1 + mapping.wastageBps / 10000;
      const quantityDeducted = baseQty * wastageMultiplier;

      results.push({
        itemId: record.item.id,
        itemName: record.item.name,
        quantityDeducted: Math.round(quantityDeducted * 100) / 100,
        unitAbbreviation: record.unit.abbreviation,
      });
    }
  }

  return results;
}

export function calculateParLevelGap(record: InventoryRecord): number {
  const current = record.stocks.reduce((sum, s) => sum + s.quantityOnHand, 0);
  return Math.max(0, record.item.parLevel - current);
}

export function calculateReorderNeed(record: InventoryRecord): number {
  const current = record.stocks.reduce((sum, s) => sum + s.quantityOnHand, 0);

  if (current > record.item.reorderPoint) {
    return 0;
  }

  return record.item.reorderQuantity;
}

export function sortByStockUrgency(records: InventoryRecord[]): InventoryRecord[] {
  const urgencyScore = (record: InventoryRecord): number => {
    const stock = record.stocks[0]?.quantityOnHand ?? 0;
    const ratio = record.item.reorderPoint > 0 ? stock / record.item.reorderPoint : 1;

    if (record.item.status === "out_of_stock") {
      return 0;
    }

    if (record.item.status === "expired") {
      return 0.1;
    }

    return ratio;
  };

  return [...records].sort((a, b) => urgencyScore(a) - urgencyScore(b));
}

export function estimateDaysUntilStockout(record: InventoryRecord): number | null {
  if (record.analytics.turnoverRate <= 0) {
    return null;
  }

  const current = record.stocks.reduce((sum, s) => sum + s.quantityOnHand, 0);
  const dailyUsage = record.analytics.turnoverRate;

  return current > 0 ? Math.round((current / dailyUsage) * 10) / 10 : 0;
}
