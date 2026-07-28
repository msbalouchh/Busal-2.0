import { StockMovementsList } from "@/modules/inventory/components/stock-movements-list";
import { getInventoryMovementsContext } from "@/modules/inventory/lib/get-inventory-context";

export default async function InventoryMovementsPage() {
  const data = await getInventoryMovementsContext();

  return <StockMovementsList movements={data.movements} />;
}
