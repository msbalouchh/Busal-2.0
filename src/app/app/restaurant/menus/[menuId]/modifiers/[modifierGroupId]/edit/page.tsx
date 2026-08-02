import type { Metadata } from "next";
import { Layers } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { EditModifierForm } from "@/modules/modifier-management/components/edit-modifier-form";
import { MODIFIER_MANAGEMENT_ROUTES } from "@/modules/modifier-management/constants/routes";
import { getModifierDetailContext } from "@/modules/modifier-management/lib/get-modifier-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface EditModifierPageProps {
  params: Promise<{ menuId: string; modifierGroupId: string }>;
}

export async function generateMetadata({ params }: EditModifierPageProps): Promise<Metadata> {
  const { menuId, modifierGroupId } = await params;
  const context = await getModifierDetailContext(menuId, modifierGroupId);

  return {
    title: `Edit ${context.modifierGroup?.name ?? "Modifier Group"}`,
  };
}

export default async function EditModifierPage({ params }: EditModifierPageProps) {
  const { menuId, modifierGroupId } = await params;
  const context = await getModifierDetailContext(menuId, modifierGroupId);

  if (!context.modifierGroup) {
    notFound();
  }

  if (!context.permissionsFlags.canUpdate) {
    redirect(MODIFIER_MANAGEMENT_ROUTES.details(menuId, modifierGroupId));
  }

  if (context.modifierGroup.status === "ARCHIVED") {
    redirect(MODIFIER_MANAGEMENT_ROUTES.details(menuId, modifierGroupId));
  }

  return (
    <ApplicationPageTemplate
      title={`Edit ${context.modifierGroup.name}`}
      description="Update modifier group settings and selection rules."
      icon={Layers}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus", href: MENU_MANAGEMENT_ROUTES.list },
        { label: context.menu.name, href: MENU_MANAGEMENT_ROUTES.details(menuId) },
        { label: "Modifiers", href: MODIFIER_MANAGEMENT_ROUTES.list(menuId) },
        {
          label: context.modifierGroup.name,
          href: MODIFIER_MANAGEMENT_ROUTES.details(menuId, modifierGroupId),
        },
        { label: "Edit" },
      ]}
    >
      <EditModifierForm menuId={menuId} modifierGroup={context.modifierGroup} />
    </ApplicationPageTemplate>
  );
}
