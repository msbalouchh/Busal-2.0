import type { Metadata } from "next";
import { Link2 } from "lucide-react";
import { redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { ProductModifierAssignmentPanel } from "@/modules/modifier-management/components/product-modifier-assignment-panel";
import { MODIFIER_MANAGEMENT_ROUTES } from "@/modules/modifier-management/constants/routes";
import { getModifierAssignmentContext } from "@/modules/modifier-management/lib/get-modifier-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface AssignModifiersPageProps {
  params: Promise<{ menuId: string }>;
  searchParams: Promise<{ productId?: string }>;
}

export async function generateMetadata({ params }: AssignModifiersPageProps): Promise<Metadata> {
  const { menuId } = await params;
  const context = await getModifierAssignmentContext(menuId);

  return {
    title: `Assign Modifiers · ${context.menu.name}`,
  };
}

export default async function AssignModifiersPage({
  params,
  searchParams,
}: AssignModifiersPageProps) {
  const { menuId } = await params;
  const { productId } = await searchParams;
  const context = await getModifierAssignmentContext(menuId, productId);

  if (!context.permissionsFlags.canAssign) {
    redirect(MODIFIER_MANAGEMENT_ROUTES.list(menuId));
  }

  return (
    <ApplicationPageTemplate
      title="Assign modifiers to products"
      description="Attach reusable modifier groups to products in this menu."
      icon={Link2}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus", href: MENU_MANAGEMENT_ROUTES.list },
        { label: context.menu.name, href: MENU_MANAGEMENT_ROUTES.details(menuId) },
        { label: "Modifiers", href: MODIFIER_MANAGEMENT_ROUTES.list(menuId) },
        { label: "Assign" },
      ]}
    >
      <ProductModifierAssignmentPanel
        context={context}
        modifierGroups={context.modifierGroups}
        products={context.products}
        assignment={context.assignment}
        selectedProductId={context.selectedProductId}
      />
    </ApplicationPageTemplate>
  );
}
