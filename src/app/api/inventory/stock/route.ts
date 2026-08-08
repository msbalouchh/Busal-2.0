import { handleUpdateInventoryStock } from "@/modules/inventory/api/inventory-route-handlers";

export async function POST(request: Request) {
  return handleUpdateInventoryStock(request);
}
