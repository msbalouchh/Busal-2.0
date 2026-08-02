import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MenuListPanel } from "@/modules/menu-management/components/menu-list-panel";
import { getMenuListContext } from "@/modules/menu-management/lib/get-menu-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import type {
  MenuListQuery,
  MenuSortField,
} from "@/modules/menu-management/types/menu-management-types";

export const metadata: Metadata = {
  title: "Menus",
};

interface MenusPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    menuType?: string;
    branchId?: string;
    sortBy?: string;
    sortDirection?: string;
    page?: string;
  }>;
}

export default async function RestaurantMenusPage({ searchParams }: MenusPageProps) {
  const params = await searchParams;
  const query: MenuListQuery = {
    search: params.search,
    status: (params.status as MenuListQuery["status"]) ?? "ALL",
    menuType: (params.menuType as MenuListQuery["menuType"]) ?? "ALL",
    branchId: params.branchId,
    sortBy: (params.sortBy as MenuSortField) ?? "displayOrder",
    sortDirection: (params.sortDirection as MenuListQuery["sortDirection"]) ?? "asc",
    page: params.page ? Number(params.page) : 1,
  };
  const context = await getMenuListContext(query);

  return (
    <ApplicationPageTemplate
      title="Menus"
      description="Manage restaurant menus, availability, and branch assignments."
      icon={BookOpen}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus" },
      ]}
    >
      <MenuListPanel
        context={context}
        list={context.list}
        stats={context.stats}
        initialSearch={params.search ?? ""}
        initialStatus={params.status ?? "ALL"}
        initialMenuType={params.menuType ?? "ALL"}
        initialBranchId={params.branchId ?? ""}
        initialSortBy={params.sortBy ?? "displayOrder"}
        initialSortDirection={params.sortDirection ?? "asc"}
      />
    </ApplicationPageTemplate>
  );
}
