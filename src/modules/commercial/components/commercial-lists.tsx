import {
  PRICING_MODEL_LABELS,
  PRICE_BOOK_TYPE_LABELS,
} from "@/modules/commercial/constants/routes";
import type {
  CommercialBundleView,
  CommercialCategoryView,
  CommercialProductView,
  PriceBookView,
} from "@/modules/commercial/utils/commercial-utils";
import { formatCommercialMoney } from "@/modules/commercial/utils/commercial-utils";

export function CommercialCategoriesList({ categories }: { categories: CommercialCategoryView[] }) {
  if (categories.length === 0) {
    return <p className="text-muted-foreground text-sm">No categories yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {categories.map((category) => (
        <li key={category.id} className="flex justify-between gap-3 rounded-md border p-3">
          <span className="font-medium">{category.name}</span>
          <span className="text-muted-foreground">{category.slug}</span>
        </li>
      ))}
    </ul>
  );
}

export function CommercialProductsList({ products }: { products: CommercialProductView[] }) {
  if (products.length === 0) {
    return <p className="text-muted-foreground text-sm">No commercial products yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {products.map((product) => (
        <li key={product.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{product.currentVersion?.name ?? product.sku}</span>
            <span className="text-muted-foreground">{product.status}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            SKU {product.sku} · v{product.versionCount} ·{" "}
            {product.currentVersion
              ? formatCommercialMoney(product.currentVersion.basePricePence)
              : "—"}{" "}
            ·{" "}
            {product.currentVersion
              ? PRICING_MODEL_LABELS[product.currentVersion.pricingModel]
              : "—"}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function CommercialBundlesList({ bundles }: { bundles: CommercialBundleView[] }) {
  if (bundles.length === 0) {
    return <p className="text-muted-foreground text-sm">No bundles yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {bundles.map((bundle) => (
        <li key={bundle.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{bundle.currentVersion?.name ?? bundle.sku}</span>
            <span>
              {bundle.currentVersion
                ? formatCommercialMoney(bundle.currentVersion.bundlePricePence)
                : "—"}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {bundle.currentVersion?.items.length ?? 0} items · v{bundle.versionCount}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function PriceBooksList({ priceBooks }: { priceBooks: PriceBookView[] }) {
  if (priceBooks.length === 0) {
    return <p className="text-muted-foreground text-sm">No price books yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {priceBooks.map((priceBook) => (
        <li key={priceBook.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{priceBook.currentVersion?.name ?? priceBook.code}</span>
            <span className="text-muted-foreground">{PRICE_BOOK_TYPE_LABELS[priceBook.type]}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {priceBook.code} · v{priceBook.versionCount} ·{" "}
            {priceBook.currentVersion?.entries.length ?? 0} entries
          </p>
        </li>
      ))}
    </ul>
  );
}
