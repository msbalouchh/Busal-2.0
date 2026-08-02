import type { Metadata } from "next";
import { FolderTree } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CategoryListPanel } from "@/modules/category-management/components/category-list-panel";
import { getCategoryListContext } from "@/modules/category-management/lib/get-category-management-context";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import type {
  CategoryListQuery,
  CategorySortField,
} from "@/modules/category-management/types/category-management-types";

interface CategoriesPageProps {
  params: Promise<{ menuId: string }>;
  searchParams: Promise<{
    search?: string;
    status?: string;
    parentCategoryId?: string;
    sortBy?: string;
    sortDirection?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: CategoriesPageProps): Promise<Metadata> {
  const { menuId } = await params;
  const context = await getCategoryListContext(menuId);

  return {
    title: `${context.menu.name} Categories`,
  };
}

export default async function MenuCategoriesPage({ params, searchParams }: CategoriesPageProps) {
  const { menuId } = await params;
  const queryParams = await searchParams;
  const query: CategoryListQuery = {
    search: queryParams.search,
    status: (queryParams.status as CategoryListQuery["status"]) ?? "ALL",
    parentCategoryId:
      (queryParams.parentCategoryId as CategoryListQuery["parentCategoryId"]) ?? "ALL",
    sortBy: (queryParams.sortBy as CategorySortField) ?? "displayOrder",
    sortDirection: (queryParams.sortDirection as CategoryListQuery["sortDirection"]) ?? "asc",
    page: queryParams.page ? Number(queryParams.page) : 1,
  };
  const context = await getCategoryListContext(menuId, query);

  return (
    <ApplicationPageTemplate
      title={`${context.menu.name} categories`}
      description="Organise menu products with nested categories, ordering, and SEO metadata."
      icon={FolderTree}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus", href: MENU_MANAGEMENT_ROUTES.list },
        { label: context.menu.name, href: MENU_MANAGEMENT_ROUTES.details(menuId) },
        { label: "Categories" },
      ]}
    >
      <CategoryListPanel
        context={context}
        list={context.list}
        stats={context.stats}
        tree={context.tree}
        initialSearch={queryParams.search ?? ""}
        initialStatus={queryParams.status ?? "ALL"}
        initialParentCategoryId={queryParams.parentCategoryId ?? "ALL"}
        initialSortBy={queryParams.sortBy ?? "displayOrder"}
        initialSortDirection={queryParams.sortDirection ?? "asc"}
      />
    </ApplicationPageTemplate>
  );
}
