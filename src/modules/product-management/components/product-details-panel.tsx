"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  archiveProductManagementAction,
  deleteProductManagementAction,
  duplicateProductManagementAction,
  publishProductManagementAction,
  restoreProductManagementAction,
} from "@/modules/product-management/actions/product-management-actions";
import { ProductPreviewPanel } from "@/modules/product-management/components/product-preview-panel";
import { ProductStatusBadge } from "@/modules/product-management/components/product-status-badge";
import { MODIFIER_MANAGEMENT_ROUTES } from "@/modules/modifier-management/constants/routes";
import { PRODUCT_MANAGEMENT_ROUTES } from "@/modules/product-management/constants/routes";
import type { ProductManagementContext } from "@/modules/product-management/lib/get-product-management-context";
import type { ProductManagementRecord } from "@/modules/product-management/types/product-management-types";

interface ProductDetailsPanelProps {
  context: ProductManagementContext;
  product: ProductManagementRecord;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" }).format(value);
}

export function ProductDetailsPanel({ context, product }: ProductDetailsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const menuId = context.menu.id;

  const runAction = (
    action: () => Promise<unknown>,
    successMessage: string,
    redirectToList = false,
  ) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        if (redirectToList) {
          router.push(PRODUCT_MANAGEMENT_ROUTES.list(menuId));
        } else {
          router.refresh();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{product.sku}</p>
            <h2 className="text-2xl font-semibold tracking-tight">{product.name}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{formatPrice(product.price)}</p>
            <div className="mt-2">
              <ProductStatusBadge status={product.status} isFeatured={product.isFeatured} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {context.permissionsFlags.canUpdate && product.status !== "ARCHIVED" ? (
              <Button asChild variant="secondary">
                <Link href={MODIFIER_MANAGEMENT_ROUTES.assign(menuId, product.id)}>
                  Manage modifiers
                </Link>
              </Button>
            ) : null}
            {context.permissionsFlags.canUpdate && product.status !== "ARCHIVED" ? (
              <Button asChild variant="outline">
                <Link href={PRODUCT_MANAGEMENT_ROUTES.edit(menuId, product.id)}>Edit product</Link>
              </Button>
            ) : null}
            {context.permissionsFlags.canCreate ? (
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => duplicateProductManagementAction(menuId, product.id),
                    "Product duplicated",
                  )
                }
              >
                Duplicate
              </Button>
            ) : null}
            {context.permissionsFlags.canPublish &&
            product.status !== "ACTIVE" &&
            product.status !== "ARCHIVED" ? (
              <Button
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => publishProductManagementAction(menuId, product.id),
                    "Product published",
                  )
                }
              >
                Publish
              </Button>
            ) : null}
            {context.permissionsFlags.canDelete && product.status !== "ARCHIVED" ? (
              <>
                <Button
                  variant="destructive"
                  disabled={isPending}
                  onClick={() =>
                    runAction(
                      () => archiveProductManagementAction(menuId, product.id),
                      "Product archived",
                    )
                  }
                >
                  Archive
                </Button>
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    runAction(
                      () => deleteProductManagementAction(menuId, product.id),
                      "Product deleted",
                      true,
                    )
                  }
                >
                  Delete
                </Button>
              </>
            ) : null}
            {context.permissionsFlags.canUpdate && product.status === "ARCHIVED" ? (
              <Button
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => restoreProductManagementAction(menuId, product.id),
                    "Product restored",
                  )
                }
              >
                Restore
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <ProductPreviewPanel product={product} />
        <section className="space-y-3 rounded-xl border p-4 sm:p-6">
          <h3 className="text-lg font-semibold">Product details</h3>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Category</dt>
              <dd>{product.categoryName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Barcode</dt>
              <dd>{product.barcode || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Tax rate</dt>
              <dd>{product.taxRate != null ? `${product.taxRate}%` : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Track inventory</dt>
              <dd>{product.trackInventory ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
