"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateProductManagementAction } from "@/modules/product-management/actions/product-management-actions";
import { ProductForm } from "@/modules/product-management/components/product-form";
import { PRODUCT_MANAGEMENT_ROUTES } from "@/modules/product-management/constants/routes";
import type { ProductManagementContext } from "@/modules/product-management/lib/get-product-management-context";
import type {
  ProductManagementInput,
  ProductManagementRecord,
} from "@/modules/product-management/types/product-management-types";

interface EditProductFormProps {
  context: ProductManagementContext;
  product: ProductManagementRecord;
}

export function EditProductForm({ context, product }: EditProductFormProps) {
  const router = useRouter();
  const menuId = context.menu.id;

  const handleSubmit = async (input: ProductManagementInput) => {
    await updateProductManagementAction(menuId, product.id, input);
    toast.success("Product updated");
    router.push(PRODUCT_MANAGEMENT_ROUTES.details(menuId, product.id));
    router.refresh();
  };

  return (
    <div className="rounded-xl border p-4 sm:p-6">
      <ProductForm
        initialProduct={product}
        categories={context.categories}
        submitLabel="Save changes"
        disabled={!context.permissionsFlags.canUpdate}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
