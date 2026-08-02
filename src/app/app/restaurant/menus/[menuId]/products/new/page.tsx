import type { Metadata } from "next";
import { Package } from "lucide-react";
import { redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { CreateProductForm } from "@/modules/product-management/components/create-product-form";
import { PRODUCT_MANAGEMENT_ROUTES } from "@/modules/product-management/constants/routes";
import { getProductManagementContext } from "@/modules/product-management/lib/get-product-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface CreateProductPageProps {
  params: Promise<{ menuId: string }>;
  searchParams: Promise<{ categoryId?: string }>;
}

export async function generateMetadata({ params }: CreateProductPageProps): Promise<Metadata> {
  const { menuId } = await params;
  const context = await getProductManagementContext(menuId);

  return {
    title: `Create Product · ${context.menu.name}`,
  };
}

export default async function CreateProductPage({ params, searchParams }: CreateProductPageProps) {
  const { menuId } = await params;
  const { categoryId } = await searchParams;
  const context = await getProductManagementContext(menuId);

  if (!context.permissionsFlags.canCreate) {
    redirect(PRODUCT_MANAGEMENT_ROUTES.list(menuId));
  }

  return (
    <ApplicationPageTemplate
      title="Create product"
      description={`Add a product to ${context.menu.name}.`}
      icon={Package}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus", href: MENU_MANAGEMENT_ROUTES.list },
        { label: context.menu.name, href: MENU_MANAGEMENT_ROUTES.details(menuId) },
        { label: "Products", href: PRODUCT_MANAGEMENT_ROUTES.list(menuId) },
        { label: "Create" },
      ]}
    >
      <CreateProductForm context={context} defaultCategoryId={categoryId} />
    </ApplicationPageTemplate>
  );
}
