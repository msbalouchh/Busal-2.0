import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CreateMenuForm } from "@/modules/menu-management/components/create-menu-form";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { getMenuManagementContext } from "@/modules/menu-management/lib/get-menu-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create Menu",
};

export default async function CreateMenuPage() {
  const context = await getMenuManagementContext();

  if (!context.permissionsFlags.canCreate) {
    redirect(MENU_MANAGEMENT_ROUTES.list);
  }

  return (
    <ApplicationPageTemplate
      title="Create menu"
      description="Add a new menu for your restaurant branches."
      icon={BookOpen}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus", href: MENU_MANAGEMENT_ROUTES.list },
        { label: "Create" },
      ]}
    >
      <CreateMenuForm context={context} />
    </ApplicationPageTemplate>
  );
}
