import type { Metadata } from "next";
import { Layers } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { ModifierListPanel } from "@/modules/modifier-management/components/modifier-list-panel";
import { getModifierListContext } from "@/modules/modifier-management/lib/get-modifier-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import type {
  ModifierListQuery,
  ModifierSortField,
} from "@/modules/modifier-management/types/modifier-management-types";

interface ModifiersPageProps {
  params: Promise<{ menuId: string }>;
  searchParams: Promise<{
    search?: string;
    status?: string;
    selectionType?: string;
    sortBy?: string;
    sortDirection?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: ModifiersPageProps): Promise<Metadata> {
  const { menuId } = await params;
  const context = await getModifierListContext(menuId);

  return {
    title: `${context.menu.name} Modifiers`,
  };
}

export default async function MenuModifiersPage({ params, searchParams }: ModifiersPageProps) {
  const { menuId } = await params;
  const queryParams = await searchParams;
  const query: ModifierListQuery = {
    search: queryParams.search,
    status: (queryParams.status as ModifierListQuery["status"]) ?? "ALL",
    selectionType: (queryParams.selectionType as ModifierListQuery["selectionType"]) ?? "ALL",
    sortBy: (queryParams.sortBy as ModifierSortField) ?? "displayOrder",
    sortDirection: (queryParams.sortDirection as ModifierListQuery["sortDirection"]) ?? "asc",
    page: queryParams.page ? Number(queryParams.page) : 1,
  };
  const context = await getModifierListContext(menuId, query);

  return (
    <ApplicationPageTemplate
      title={`${context.menu.name} modifiers`}
      description="Create reusable modifier groups and options, then assign them to menu products."
      icon={Layers}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus", href: MENU_MANAGEMENT_ROUTES.list },
        { label: context.menu.name, href: MENU_MANAGEMENT_ROUTES.details(menuId) },
        { label: "Modifiers" },
      ]}
    >
      <ModifierListPanel
        context={context}
        list={context.list}
        stats={context.stats}
        initialSearch={queryParams.search ?? ""}
        initialStatus={queryParams.status ?? "ALL"}
        initialSelectionType={queryParams.selectionType ?? "ALL"}
        initialSortBy={queryParams.sortBy ?? "displayOrder"}
        initialSortDirection={queryParams.sortDirection ?? "asc"}
      />
    </ApplicationPageTemplate>
  );
}
