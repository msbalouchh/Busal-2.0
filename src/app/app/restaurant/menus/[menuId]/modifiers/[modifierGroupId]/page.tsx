import type { Metadata } from "next";
import { Layers } from "lucide-react";
import { notFound } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { ModifierDetailsPanel } from "@/modules/modifier-management/components/modifier-details-panel";
import { MODIFIER_MANAGEMENT_ROUTES } from "@/modules/modifier-management/constants/routes";
import { getModifierDetailContext } from "@/modules/modifier-management/lib/get-modifier-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface ModifierDetailsPageProps {
  params: Promise<{ menuId: string; modifierGroupId: string }>;
}

export async function generateMetadata({ params }: ModifierDetailsPageProps): Promise<Metadata> {
  const { menuId, modifierGroupId } = await params;
  const context = await getModifierDetailContext(menuId, modifierGroupId);

  return {
    title: context.modifierGroup?.name ?? "Modifier Group Details",
  };
}

export default async function ModifierDetailsPage({ params }: ModifierDetailsPageProps) {
  const { menuId, modifierGroupId } = await params;
  const context = await getModifierDetailContext(menuId, modifierGroupId);

  if (!context.modifierGroup) {
    notFound();
  }

  return (
    <ApplicationPageTemplate
      title={context.modifierGroup.name}
      description="Modifier group details, options, and lifecycle actions."
      icon={Layers}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus", href: MENU_MANAGEMENT_ROUTES.list },
        { label: context.menu.name, href: MENU_MANAGEMENT_ROUTES.details(menuId) },
        { label: "Modifiers", href: MODIFIER_MANAGEMENT_ROUTES.list(menuId) },
        { label: context.modifierGroup.name },
      ]}
    >
      <ModifierDetailsPanel context={context} modifierGroup={context.modifierGroup} />
    </ApplicationPageTemplate>
  );
}
