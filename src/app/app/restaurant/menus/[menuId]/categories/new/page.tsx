import type { Metadata } from "next";
import { FolderTree } from "lucide-react";
import { redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CreateCategoryForm } from "@/modules/category-management/components/create-category-form";
import { CATEGORY_MANAGEMENT_ROUTES } from "@/modules/category-management/constants/routes";
import { getCategoryCreateContext } from "@/modules/category-management/lib/get-category-management-context";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface CreateCategoryPageProps {
  params: Promise<{ menuId: string }>;
}

export async function generateMetadata({ params }: CreateCategoryPageProps): Promise<Metadata> {
  const { menuId } = await params;
  const context = await getCategoryCreateContext(menuId);

  return {
    title: `Create Category · ${context.menu.name}`,
  };
}

export default async function CreateCategoryPage({ params }: CreateCategoryPageProps) {
  const { menuId } = await params;
  const context = await getCategoryCreateContext(menuId);

  if (!context.permissionsFlags.canCreate) {
    redirect(CATEGORY_MANAGEMENT_ROUTES.list(menuId));
  }

  return (
    <ApplicationPageTemplate
      title="Create category"
      description={`Add a category to ${context.menu.name}.`}
      icon={FolderTree}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus", href: MENU_MANAGEMENT_ROUTES.list },
        { label: context.menu.name, href: MENU_MANAGEMENT_ROUTES.details(menuId) },
        { label: "Categories", href: CATEGORY_MANAGEMENT_ROUTES.list(menuId) },
        { label: "Create" },
      ]}
    >
      <CreateCategoryForm context={context} parentOptions={context.parentOptions} />
    </ApplicationPageTemplate>
  );
}
