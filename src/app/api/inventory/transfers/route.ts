import { handleCreateInventoryTransfer } from "@/modules/inventory/api/inventory-route-handlers";

export async function POST(request: Request) {
  return handleCreateInventoryTransfer(request);
}
