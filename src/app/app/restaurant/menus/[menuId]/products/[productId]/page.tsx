import type { Metadata } from "next";
import { Package } from "lucide-react";
import { notFound } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { ProductDetailsPanel } from "@/modules/product-management/components/product-details-panel";
import { PRODUCT_MANAGEMENT_ROUTES } from "@/modules/product-management/constants/routes";
import { getProductDetailContext } from "@/modules/product-management/lib/get-product-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface ProductDetailsPageProps {
  params: Promise<{ menuId: string; productId: string }>;
}

export async function generateMetadata({ params }: ProductDetailsPageProps): Promise<Metadata> {
  const { menuId, productId } = await params;
  const context = await getProductDetailContext(menuId, productId);

  return {
    title: context.product?.name ?? "Product Details",
  };
}

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { menuId, productId } = await params;
  const context = await getProductDetailContext(menuId, productId);

  if (!context.product) {
    notFound();
  }

  return (
    <ApplicationPageTemplate
      title={context.product.name}
      description="Product profile, preview, and publishing actions."
      icon={Package}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus", href: MENU_MANAGEMENT_ROUTES.list },
        { label: context.menu.name, href: MENU_MANAGEMENT_ROUTES.details(menuId) },
        { label: "Products", href: PRODUCT_MANAGEMENT_ROUTES.list(menuId) },
        { label: context.product.name },
      ]}
    >
      <ProductDetailsPanel context={context} product={context.product} />
    </ApplicationPageTemplate>
  );
}
