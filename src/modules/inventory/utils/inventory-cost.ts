import { Decimal } from "@prisma/client/runtime/library";

export function decimalFromInput(value: string | number): Decimal {
  return new Decimal(value);
}

export function calculateRecipeLineCostPence(
  quantity: Decimal,
  wastePercent: Decimal,
  costPricePence: number,
): number {
  const wasteMultiplier = new Decimal(1).add(wastePercent.div(100));
  const lineCost = quantity.mul(wasteMultiplier).mul(costPricePence);

  return lineCost.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

export function calculateRequiredQuantity(
  recipeQuantity: Decimal,
  orderItemQuantity: number,
  wastePercent: Decimal,
): Decimal {
  const wasteMultiplier = new Decimal(1).add(wastePercent.div(100));

  return recipeQuantity.mul(orderItemQuantity).mul(wasteMultiplier);
}

export function formatStockQuantity(value: Decimal | number): string {
  const decimal = value instanceof Decimal ? value : new Decimal(value);

  return decimal.toFixed(4).replace(/\.?0+$/, "");
}
