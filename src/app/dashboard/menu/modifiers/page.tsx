import type { Metadata } from "next";

import { ModifiersManager } from "@/modules/menu/components/modifiers-manager";
import { MenuPageHeader } from "@/modules/menu/components/menu-page-header";
import { getMenuModuleContext } from "@/modules/menu/lib/get-menu-context";

export const metadata: Metadata = {
  title: "Menu Modifiers",
};

export default async function MenuModifiersPage() {
  const { modifierGroups, menuItems } = await getMenuModuleContext();

  return (
    <div className="space-y-6">
      <MenuPageHeader
        title="Modifiers"
        description="Create modifier groups and options, then assign them to menu items."
      />
      <ModifiersManager modifierGroups={modifierGroups} menuItems={menuItems} />
    </div>
  );
}
