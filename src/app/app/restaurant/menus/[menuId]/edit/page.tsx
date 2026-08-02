import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EditMenuForm } from "@/modules/menu-management/components/edit-menu-form";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { getMenuDetailContext } from "@/modules/menu-management/lib/get-menu-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface EditMenuPageProps {
  params: Promise<{ menuId: string }>;
}

export async function generateMetadata({ params }: EditMenuPageProps): Promise<Metadata> {
  const { menuId } = await params;
  const context = await getMenuDetailContext(menuId);

  return {
    title: context.menu ? `Edit ${context.menu.name}` : "Edit Menu",
  };
}

export default async function EditMenuPage({ params }: EditMenuPageProps) {
  const { menuId } = await params;
  const context = await getMenuDetailContext(menuId);

  if (!context.menu) {
    notFound();
  }

  if (!context.permissionsFlags.canUpdate) {
    redirect(MENU_MANAGEMENT_ROUTES.details(menuId));
  }

  if (context.menu.status === "ARCHIVED") {
    redirect(MENU_MANAGEMENT_ROUTES.details(menuId));
  }

  return (
    <ApplicationPageTemplate
      title={`Edit ${context.menu.name}`}
      description="Update menu details, availability, and display settings."
      icon={BookOpen}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus", href: MENU_MANAGEMENT_ROUTES.list },
        { label: context.menu.name, href: MENU_MANAGEMENT_ROUTES.details(menuId) },
        { label: "Edit" },
      ]}
    >
      <EditMenuForm context={context} menu={context.menu} />
    </ApplicationPageTemplate>
  );
}
