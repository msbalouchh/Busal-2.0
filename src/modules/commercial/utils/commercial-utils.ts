import { formatMoneyPence } from "@/modules/payments/utils/currency";
import type {
  CommercialBundleData,
  CommercialCatalogueDashboard,
  CommercialCategoryData,
  CommercialProductData,
  PriceBookData,
} from "@/services/commercial-catalogue.service";

export function formatCommercialMoney(pence: number): string {
  return formatMoneyPence(pence);
}

export type CommercialDashboardView = CommercialCatalogueDashboard;
export type CommercialCategoryView = CommercialCategoryData;
export type CommercialProductView = CommercialProductData;
export type CommercialBundleView = CommercialBundleData;
export type PriceBookView = PriceBookData;

export function serializeCommercialDashboard(
  dashboard: CommercialCatalogueDashboard,
): CommercialDashboardView {
  return dashboard;
}

export function serializeCommercialProduct(product: CommercialProductData): CommercialProductView {
  return product;
}

export function serializeCommercialBundle(bundle: CommercialBundleData): CommercialBundleView {
  return bundle;
}

export function serializePriceBook(priceBook: PriceBookData): PriceBookView {
  return priceBook;
}
