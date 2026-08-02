"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateCategoryManagementAction } from "@/modules/category-management/actions/category-management-actions";
import { CategoryForm } from "@/modules/category-management/components/category-form";
import { CATEGORY_MANAGEMENT_ROUTES } from "@/modules/category-management/constants/routes";
import type { CategoryManagementContext } from "@/modules/category-management/lib/get-category-management-context";
import type {
  CategoryManagementInput,
  CategoryManagementRecord,
} from "@/modules/category-management/types/category-management-types";

interface EditCategoryFormProps {
  context: CategoryManagementContext;
  category: CategoryManagementRecord;
  parentOptions: CategoryManagementRecord[];
}

export function EditCategoryForm({ context, category, parentOptions }: EditCategoryFormProps) {
  const router = useRouter();
  const menuId = context.menu.id;

  const handleSubmit = async (input: CategoryManagementInput) => {
    await updateCategoryManagementAction(menuId, category.id, input);
    toast.success("Category updated");
    router.push(CATEGORY_MANAGEMENT_ROUTES.details(menuId, category.id));
    router.refresh();
  };

  return (
    <div className="rounded-xl border p-4 sm:p-6">
      <CategoryForm
        initialCategory={category}
        parentOptions={parentOptions}
        submitLabel="Save changes"
        disabled={!context.permissionsFlags.canUpdate}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
