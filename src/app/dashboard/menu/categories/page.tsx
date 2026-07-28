import type { Metadata } from "next";

import { CategoriesManager } from "@/modules/menu/components/categories-manager";
import { MenuPageHeader } from "@/modules/menu/components/menu-page-header";
import { getMenuModuleContext } from "@/modules/menu/lib/get-menu-context";

export const metadata: Metadata = {
  title: "Menu Categories",
};

export default async function MenuCategoriesPage() {
  const { categories } = await getMenuModuleContext();

  return (
    <div className="space-y-6">
      <MenuPageHeader
        title="Categories"
        description="Organize your menu with categories. Reorder, activate, or deactivate as needed."
      />
      <CategoriesManager categories={categories} />
    </div>
  );
}
