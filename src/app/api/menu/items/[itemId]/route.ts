import {
  handleDeleteMenuItem,
  handleGetMenuItem,
  handleUpdateMenuItem,
} from "@/modules/menu/api/menu-route-handlers";

export async function GET(request: Request, context: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await context.params;
  return handleGetMenuItem(request, itemId);
}

export async function PATCH(request: Request, context: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await context.params;
  return handleUpdateMenuItem(request, itemId);
}

export async function DELETE(request: Request, context: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await context.params;
  return handleDeleteMenuItem(request, itemId);
}
