"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createProductManagementAction } from "@/modules/product-management/actions/product-management-actions";
import { ProductForm } from "@/modules/product-management/components/product-form";
import { PRODUCT_MANAGEMENT_ROUTES } from "@/modules/product-management/constants/routes";
import type { ProductManagementContext } from "@/modules/product-management/lib/get-product-management-context";
import type { ProductManagementInput } from "@/modules/product-management/types/product-management-types";

interface CreateProductFormProps {
  context: ProductManagementContext;
  defaultCategoryId?: string;
}

export function CreateProductForm({ context, defaultCategoryId }: CreateProductFormProps) {
  const router = useRouter();
  const menuId = context.menu.id;

  const handleSubmit = async (input: ProductManagementInput) => {
    const result = await createProductManagementAction(menuId, input);
    toast.success("Product created");
    router.push(PRODUCT_MANAGEMENT_ROUTES.details(menuId, result.productId));
    router.refresh();
  };

  return (
    <div className="rounded-xl border p-4 sm:p-6">
      <ProductForm
        categories={context.categories}
        defaultCategoryId={defaultCategoryId}
        submitLabel="Create product"
        disabled={!context.permissionsFlags.canCreate}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
