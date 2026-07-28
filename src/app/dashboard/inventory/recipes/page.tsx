import { RecipesManager } from "@/modules/inventory/components/recipes-manager";
import { getInventoryRecipesContext } from "@/modules/inventory/lib/get-inventory-context";

export default async function InventoryRecipesPage() {
  const data = await getInventoryRecipesContext();

  return (
    <RecipesManager
      recipes={data.recipes}
      ingredients={data.ingredients}
      menuItems={data.menuItems}
    />
  );
}
