import type { Metadata } from "next";
import { Package } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { ProductListPanel } from "@/modules/product-management/components/product-list-panel";
import { getProductListContext } from "@/modules/product-management/lib/get-product-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import type {
  ProductListQuery,
  ProductSortField,
} from "@/modules/product-management/types/product-management-types";

interface ProductsPageProps {
  params: Promise<{ menuId: string }>;
  searchParams: Promise<{
    search?: string;
    status?: string;
    productType?: string;
    categoryId?: string;
    dietary?: string;
    sortBy?: string;
    sortDirection?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: ProductsPageProps): Promise<Metadata> {
  const { menuId } = await params;
  const context = await getProductListContext(menuId);

  return {
    title: `${context.menu.name} Products`,
  };
}

export default async function MenuProductsPage({ params, searchParams }: ProductsPageProps) {
  const { menuId } = await params;
  const queryParams = await searchParams;
  const query: ProductListQuery = {
    search: queryParams.search,
    status: (queryParams.status as ProductListQuery["status"]) ?? "ALL",
    productType: (queryParams.productType as ProductListQuery["productType"]) ?? "ALL",
    categoryId: queryParams.categoryId,
    dietary: (queryParams.dietary as ProductListQuery["dietary"]) ?? "ALL",
    sortBy: (queryParams.sortBy as ProductSortField) ?? "displayOrder",
    sortDirection: (queryParams.sortDirection as ProductListQuery["sortDirection"]) ?? "asc",
    page: queryParams.page ? Number(queryParams.page) : 1,
  };
  const context = await getProductListContext(menuId, query);

  return (
    <ApplicationPageTemplate
      title={`${context.menu.name} products`}
      description="Manage menu products for POS, ordering, kitchen, and future inventory workflows."
      icon={Package}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Menus", href: MENU_MANAGEMENT_ROUTES.list },
        { label: context.menu.name, href: MENU_MANAGEMENT_ROUTES.details(menuId) },
        { label: "Products" },
      ]}
    >
      <ProductListPanel
        context={context}
        list={context.list}
        stats={context.stats}
        initialSearch={queryParams.search ?? ""}
        initialStatus={queryParams.status ?? "ALL"}
        initialProductType={queryParams.productType ?? "ALL"}
        initialCategoryId={queryParams.categoryId ?? ""}
        initialDietary={queryParams.dietary ?? "ALL"}
        initialSortBy={queryParams.sortBy ?? "displayOrder"}
        initialSortDirection={queryParams.sortDirection ?? "asc"}
      />
    </ApplicationPageTemplate>
  );
}
