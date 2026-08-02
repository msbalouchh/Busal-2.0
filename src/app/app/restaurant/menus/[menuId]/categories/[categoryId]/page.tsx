import type { Metadata } from "next";
import { FolderTree } from "lucide-react";
import { notFound } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CategoryDetailsPanel } from "@/modules/category-management/components/category-details-panel";
import { CATEGORY_MANAGEMENT_ROUTES } from "@/modules/category-management/constants/routes";
import { getCategoryDetailContext } from "@/modules/category-management/lib/get-category-management-context";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface CategoryDetailsPageProps {
  params: Promise<{ menuId: string; categoryId: string }>;
}

export async function generateMetadata({ params }: CategoryDetailsPageProps): Promise<Metadata> {
  const { menuId, categoryId } = await params;
  const context = await getCategoryDetailContext(menuId, categoryId);

  return {
    title: context.category?.name ?? "Category Details",
  };
}

export default async function CategoryDetailsPage({ params }: CategoryDetailsPageProps) {
  const { menuId, categoryId } = await params;
  const context = await getCategoryDetailContext(menuId, categoryId);

  if (!context.category) {
    notFound();
  }

  return (
    <ApplicationPageTemplate
      title={context.category.name}
      description="Category profile, preview, and publishing actions."
      icon={FolderTree}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus", href: MENU_MANAGEMENT_ROUTES.list },
        { label: context.menu.name, href: MENU_MANAGEMENT_ROUTES.details(menuId) },
        { label: "Categories", href: CATEGORY_MANAGEMENT_ROUTES.list(menuId) },
        { label: context.category.name },
      ]}
    >
      <CategoryDetailsPanel context={context} category={context.category} />
    </ApplicationPageTemplate>
  );
}
