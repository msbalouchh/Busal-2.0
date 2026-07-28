import type { Metadata } from "next";

import { MenuItemsManager } from "@/modules/menu/components/menu-items-manager";
import { MenuPageHeader } from "@/modules/menu/components/menu-page-header";
import { getMenuModuleContext } from "@/modules/menu/lib/get-menu-context";

export const metadata: Metadata = {
  title: "Menu Items",
};

export default async function MenuItemsPage() {
  const { menuItems, categories, modifierGroups } = await getMenuModuleContext();

  return (
    <div className="space-y-6">
      <MenuPageHeader
        title="Menu Items"
        description="Manage items, assign categories, and control availability and featured status."
      />
      <MenuItemsManager
        menuItems={menuItems}
        categories={categories}
        modifierGroups={modifierGroups}
      />
    </div>
  );
}
