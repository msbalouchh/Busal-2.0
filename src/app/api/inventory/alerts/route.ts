import { handleInventoryExpiring, handleInventoryLowStock } from "@/modules/inventory/api/inventory-route-handlers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("type") === "expiring") {
    return handleInventoryExpiring(request);
  }
  return handleInventoryLowStock(request);
}
