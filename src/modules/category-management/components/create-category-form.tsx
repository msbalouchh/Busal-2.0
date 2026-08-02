"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createCategoryManagementAction } from "@/modules/category-management/actions/category-management-actions";
import { CategoryForm } from "@/modules/category-management/components/category-form";
import { CATEGORY_MANAGEMENT_ROUTES } from "@/modules/category-management/constants/routes";
import type { CategoryManagementContext } from "@/modules/category-management/lib/get-category-management-context";
import type {
  CategoryManagementInput,
  CategoryManagementRecord,
} from "@/modules/category-management/types/category-management-types";

interface CreateCategoryFormProps {
  context: CategoryManagementContext;
  parentOptions: CategoryManagementRecord[];
}

export function CreateCategoryForm({ context, parentOptions }: CreateCategoryFormProps) {
  const router = useRouter();
  const menuId = context.menu.id;

  const handleSubmit = async (input: CategoryManagementInput) => {
    const result = await createCategoryManagementAction(menuId, input);
    toast.success("Category created");
    router.push(CATEGORY_MANAGEMENT_ROUTES.details(menuId, result.categoryId));
    router.refresh();
  };

  return (
    <div className="rounded-xl border p-4 sm:p-6">
      <CategoryForm
        parentOptions={parentOptions}
        submitLabel="Create category"
        disabled={!context.permissionsFlags.canCreate}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
