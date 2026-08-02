import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { notFound } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MenuDetailsPanel } from "@/modules/menu-management/components/menu-details-panel";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { getMenuDetailContext } from "@/modules/menu-management/lib/get-menu-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface MenuDetailsPageProps {
  params: Promise<{ menuId: string }>;
}

export async function generateMetadata({ params }: MenuDetailsPageProps): Promise<Metadata> {
  const { menuId } = await params;
  const context = await getMenuDetailContext(menuId);

  return {
    title: context.menu?.name ?? "Menu Details",
  };
}

export default async function MenuDetailsPage({ params }: MenuDetailsPageProps) {
  const { menuId } = await params;
  const context = await getMenuDetailContext(menuId);

  if (!context.menu) {
    notFound();
  }

  return (
    <ApplicationPageTemplate
      title={context.menu.name}
      description="Menu profile, preview, and branch assignment."
      icon={BookOpen}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus", href: MENU_MANAGEMENT_ROUTES.list },
        { label: context.menu.name },
      ]}
    >
      <MenuDetailsPanel context={context} menu={context.menu} />
    </ApplicationPageTemplate>
  );
}
