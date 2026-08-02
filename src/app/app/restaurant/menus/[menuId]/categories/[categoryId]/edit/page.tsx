import type { Metadata } from "next";
import { FolderTree } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EditCategoryForm } from "@/modules/category-management/components/edit-category-form";
import { CATEGORY_MANAGEMENT_ROUTES } from "@/modules/category-management/constants/routes";
import { getCategoryDetailContext } from "@/modules/category-management/lib/get-category-management-context";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface EditCategoryPageProps {
  params: Promise<{ menuId: string; categoryId: string }>;
}

export async function generateMetadata({ params }: EditCategoryPageProps): Promise<Metadata> {
  const { menuId, categoryId } = await params;
  const context = await getCategoryDetailContext(menuId, categoryId);

  return {
    title: context.category ? `Edit ${context.category.name}` : "Edit Category",
  };
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { menuId, categoryId } = await params;
  const context = await getCategoryDetailContext(menuId, categoryId);

  if (!context.category) {
    notFound();
  }

  if (!context.permissionsFlags.canUpdate) {
    redirect(CATEGORY_MANAGEMENT_ROUTES.details(menuId, categoryId));
  }

  if (context.category.status === "ARCHIVED") {
    redirect(CATEGORY_MANAGEMENT_ROUTES.details(menuId, categoryId));
  }

  return (
    <ApplicationPageTemplate
      title={`Edit ${context.category.name}`}
      description="Update category details, hierarchy, and SEO settings."
      icon={FolderTree}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus", href: MENU_MANAGEMENT_ROUTES.list },
        { label: context.menu.name, href: MENU_MANAGEMENT_ROUTES.details(menuId) },
        { label: "Categories", href: CATEGORY_MANAGEMENT_ROUTES.list(menuId) },
        {
          label: context.category.name,
          href: CATEGORY_MANAGEMENT_ROUTES.details(menuId, categoryId),
        },
        { label: "Edit" },
      ]}
    >
      <EditCategoryForm
        context={context}
        category={context.category}
        parentOptions={context.parentOptions}
      />
    </ApplicationPageTemplate>
  );
}
