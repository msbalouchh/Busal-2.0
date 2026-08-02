import type { Metadata } from "next";
import { Package } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { EditProductForm } from "@/modules/product-management/components/edit-product-form";
import { PRODUCT_MANAGEMENT_ROUTES } from "@/modules/product-management/constants/routes";
import { getProductDetailContext } from "@/modules/product-management/lib/get-product-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface EditProductPageProps {
  params: Promise<{ menuId: string; productId: string }>;
}

export async function generateMetadata({ params }: EditProductPageProps): Promise<Metadata> {
  const { menuId, productId } = await params;
  const context = await getProductDetailContext(menuId, productId);

  return {
    title: context.product ? `Edit ${context.product.name}` : "Edit Product",
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { menuId, productId } = await params;
  const context = await getProductDetailContext(menuId, productId);

  if (!context.product) {
    notFound();
  }

  if (!context.permissionsFlags.canUpdate) {
    redirect(PRODUCT_MANAGEMENT_ROUTES.details(menuId, productId));
  }

  if (context.product.status === "ARCHIVED") {
    redirect(PRODUCT_MANAGEMENT_ROUTES.details(menuId, productId));
  }

  return (
    <ApplicationPageTemplate
      title={`Edit ${context.product.name}`}
      description="Update product details, pricing, and dietary metadata."
      icon={Package}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus", href: MENU_MANAGEMENT_ROUTES.list },
        { label: context.menu.name, href: MENU_MANAGEMENT_ROUTES.details(menuId) },
        { label: "Products", href: PRODUCT_MANAGEMENT_ROUTES.list(menuId) },
        {
          label: context.product.name,
          href: PRODUCT_MANAGEMENT_ROUTES.details(menuId, productId),
        },
        { label: "Edit" },
      ]}
    >
      <EditProductForm context={context} product={context.product} />
    </ApplicationPageTemplate>
  );
}
