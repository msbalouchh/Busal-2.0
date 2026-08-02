import { Package, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PRODUCT_MANAGEMENT_ROUTES } from "@/modules/product-management/constants/routes";

interface ProductEmptyStateProps {
  menuId: string;
  canCreate?: boolean;
}

export function ProductEmptyState({ menuId, canCreate = false }: ProductEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <Package className="text-muted-foreground mb-4 h-10 w-10" aria-hidden="true" />
      <h3 className="text-lg font-semibold">No products yet</h3>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        Add products to your menu categories. Products power POS, QR ordering, kitchen display, and
        future inventory workflows.
      </p>
      {canCreate ? (
        <Button asChild className="mt-6">
          <Link href={PRODUCT_MANAGEMENT_ROUTES.create(menuId)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Create product
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
