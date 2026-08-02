import type { Metadata } from "next";
import { Layers } from "lucide-react";
import { redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { CreateModifierForm } from "@/modules/modifier-management/components/create-modifier-form";
import { MODIFIER_MANAGEMENT_ROUTES } from "@/modules/modifier-management/constants/routes";
import { getModifierManagementContext } from "@/modules/modifier-management/lib/get-modifier-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface CreateModifierPageProps {
  params: Promise<{ menuId: string }>;
}

export async function generateMetadata({ params }: CreateModifierPageProps): Promise<Metadata> {
  const { menuId } = await params;
  const context = await getModifierManagementContext(menuId);

  return {
    title: `Create Modifier Group · ${context.menu.name}`,
  };
}

export default async function CreateModifierPage({ params }: CreateModifierPageProps) {
  const { menuId } = await params;
  const context = await getModifierManagementContext(menuId);

  if (!context.permissionsFlags.canCreate) {
    redirect(MODIFIER_MANAGEMENT_ROUTES.list(menuId));
  }

  return (
    <ApplicationPageTemplate
      title="Create modifier group"
      description={`Add a reusable modifier group to ${context.menu.name}.`}
      icon={Layers}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus", href: MENU_MANAGEMENT_ROUTES.list },
        { label: context.menu.name, href: MENU_MANAGEMENT_ROUTES.details(menuId) },
        { label: "Modifiers", href: MODIFIER_MANAGEMENT_ROUTES.list(menuId) },
        { label: "Create" },
      ]}
    >
      <CreateModifierForm menuId={menuId} />
    </ApplicationPageTemplate>
  );
}
