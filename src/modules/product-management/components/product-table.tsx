import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ProductStatusBadge } from "@/modules/product-management/components/product-status-badge";
import { PRODUCT_MANAGEMENT_ROUTES } from "@/modules/product-management/constants/routes";
import type { ProductManagementRecord } from "@/modules/product-management/types/product-management-types";

interface ProductTableProps {
  menuId: string;
  items: ProductManagementRecord[];
  selectedIds?: string[];
  onToggleSelect?: (productId: string) => void;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" }).format(value);
}

export function ProductTable({
  menuId,
  items,
  selectedIds = [],
  onToggleSelect,
}: ProductTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-muted/40 border-b">
          <tr>
            {onToggleSelect ? <th className="px-4 py-3" /> : null}
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">SKU</th>
            <th className="px-4 py-3 text-left font-medium">Category</th>
            <th className="px-4 py-3 text-left font-medium">Price</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((product) => (
            <tr key={product.id} className="border-b last:border-b-0">
              {onToggleSelect ? (
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={() => onToggleSelect(product.id)}
                    aria-label={`Select ${product.name}`}
                  />
                </td>
              ) : null}
              <td className="px-4 py-3 font-medium">{product.name}</td>
              <td className="px-4 py-3">{product.sku}</td>
              <td className="px-4 py-3">{product.categoryName}</td>
              <td className="px-4 py-3">{formatPrice(product.price)}</td>
              <td className="px-4 py-3">
                <ProductStatusBadge status={product.status} isFeatured={product.isFeatured} />
              </td>
              <td className="px-4 py-3 text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={PRODUCT_MANAGEMENT_ROUTES.details(menuId, product.id)}>View</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
