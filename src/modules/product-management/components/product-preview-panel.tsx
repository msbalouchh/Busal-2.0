import { ProductStatusBadge } from "@/modules/product-management/components/product-status-badge";
import type { ProductManagementRecord } from "@/modules/product-management/types/product-management-types";

interface ProductPreviewPanelProps {
  product: ProductManagementRecord;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" }).format(value);
}

export function ProductPreviewPanel({ product }: ProductPreviewPanelProps) {
  return (
    <section className="overflow-hidden rounded-xl border">
      {product.image ? (
        <div
          className="bg-muted h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${product.image})` }}
          role="img"
          aria-label={`${product.name} preview`}
        />
      ) : (
        <div className="bg-muted flex h-48 items-center justify-center">
          <span className="text-muted-foreground text-sm">Product preview</span>
        </div>
      )}
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-sm">{product.sku}</p>
            <h3 className="text-2xl font-semibold tracking-tight">{product.name}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{product.categoryName}</p>
          </div>
          <ProductStatusBadge status={product.status} isFeatured={product.isFeatured} />
        </div>
        {product.shortDescription ? (
          <p className="text-sm font-medium">{product.shortDescription}</p>
        ) : null}
        {product.description ? (
          <p className="text-muted-foreground text-sm">{product.description}</p>
        ) : null}
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Price</dt>
            <dd>{formatPrice(product.price)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Product type</dt>
            <dd>{product.productType}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Prep time</dt>
            <dd>{product.preparationTime != null ? `${product.preparationTime} min` : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Calories</dt>
            <dd>{product.calories ?? "—"}</dd>
          </div>
        </dl>
        {product.gallery.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {product.gallery.map((url) => (
              <div
                key={url}
                className="bg-muted h-20 rounded-md bg-cover bg-center"
                style={{ backgroundImage: `url(${url})` }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
