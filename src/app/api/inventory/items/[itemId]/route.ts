import {
  handleArchiveInventoryItem,
  handleGetInventoryItem,
  handleRestoreInventoryItem,
  handleUpdateInventoryItem,
} from "@/modules/inventory/api/inventory-route-handlers";

export async function GET(_request: Request, context: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await context.params;
  return handleGetInventoryItem(_request, itemId);
}

export async function PATCH(request: Request, context: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await context.params;
  return handleUpdateInventoryItem(request, itemId);
}

export async function DELETE(_request: Request, context: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await context.params;
  return handleArchiveInventoryItem(_request, itemId);
}

export async function PUT(_request: Request, context: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await context.params;
  return handleRestoreInventoryItem(_request, itemId);
}
