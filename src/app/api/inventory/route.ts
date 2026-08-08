import {
  handleBulkInventoryAction,
  handleCreateInventoryItem,
  handleCreateInventoryPurchaseOrder,
  handleCreateInventoryTransfer,
  handleInventoryExpiring,
  handleInventoryLowStock,
  handleListInventoryItems,
  handleReceiveInventoryGoods,
  handleRecordInventoryWaste,
  handleUpdateInventoryStock,
} from "@/modules/inventory/api/inventory-route-handlers";

export async function GET(request: Request) {
  return handleListInventoryItems(request);
}

export async function POST(request: Request) {
  return handleCreateInventoryItem(request);
}

export async function PATCH(request: Request) {
  return handleBulkInventoryAction(request);
}
