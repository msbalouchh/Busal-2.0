import { IngredientsManager } from "@/modules/inventory/components/ingredients-manager";
import { getInventoryIngredientsContext } from "@/modules/inventory/lib/get-inventory-context";

export default async function InventoryIngredientsPage() {
  const data = await getInventoryIngredientsContext();

  return <IngredientsManager ingredients={data.ingredients} categories={data.categories} />;
}
