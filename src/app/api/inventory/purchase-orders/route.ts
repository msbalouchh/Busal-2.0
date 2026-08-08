import {
  handleCreateInventoryPurchaseOrder,
  handleReceiveInventoryGoods,
} from "@/modules/inventory/api/inventory-route-handlers";

export async function POST(request: Request) {
  return handleCreateInventoryPurchaseOrder(request);
}

export async function PATCH(request: Request) {
  return handleReceiveInventoryGoods(request);
}
