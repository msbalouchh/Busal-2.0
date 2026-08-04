import { handleMenuItemAiInsights } from "@/modules/menu/api/menu-route-handlers";

export async function GET(request: Request, context: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await context.params;
  return handleMenuItemAiInsights(request, itemId);
}
