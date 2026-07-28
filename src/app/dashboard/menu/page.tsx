import type { Metadata } from "next";

import { MenuOverview } from "@/modules/menu/components/menu-overview";
import { MenuPageHeader } from "@/modules/menu/components/menu-page-header";
import { getMenuModuleContext } from "@/modules/menu/lib/get-menu-context";

export const metadata: Metadata = {
  title: "Menu Overview",
};

export default async function MenuOverviewPage() {
  const { categories, menuItems, modifierGroups } = await getMenuModuleContext();

  return (
    <div className="space-y-6">
      <MenuPageHeader
        title="Menu Overview"
        description="Summary of your categories, items, and modifier groups."
      />
      <MenuOverview categories={categories} menuItems={menuItems} modifierGroups={modifierGroups} />
    </div>
  );
}
