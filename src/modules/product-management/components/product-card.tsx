import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductStatusBadge } from "@/modules/product-management/components/product-status-badge";
import { PRODUCT_MANAGEMENT_ROUTES } from "@/modules/product-management/constants/routes";
import type { ProductManagementRecord } from "@/modules/product-management/types/product-management-types";

interface ProductCardProps {
  menuId: string;
  product: ProductManagementRecord;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" }).format(value);
}

export function ProductCard({ menuId, product }: ProductCardProps) {
  return (
    <Link
      href={PRODUCT_MANAGEMENT_ROUTES.details(menuId, product.id)}
      className="group block h-full"
    >
      <Card className="flex h-full flex-col overflow-hidden rounded-xl shadow-sm transition-shadow group-hover:shadow-md">
        {product.image ? (
          <div
            className="bg-muted h-36 bg-cover bg-center"
            style={{ backgroundImage: `url(${product.image})` }}
            role="img"
            aria-label={`${product.name} image`}
          />
        ) : (
          <div className="bg-muted flex h-36 items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{product.name}</CardTitle>
              <CardDescription>{product.sku}</CardDescription>
            </div>
            <ProductStatusBadge status={product.status} isFeatured={product.isFeatured} />
          </div>
        </CardHeader>
        <CardContent className="mt-auto space-y-2 text-sm">
          <p className="font-medium">{formatPrice(product.price)}</p>
          <p className="text-muted-foreground">{product.categoryName}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
