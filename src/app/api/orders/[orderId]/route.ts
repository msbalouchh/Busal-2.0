import {
  handleCancelOrder,
  handleGetOrder,
  handleRefundOrder,
  handleUpdateOrder,
} from "@/modules/orders/api/orders-route-handlers";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  return handleGetOrder(request, orderId);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  return handleUpdateOrder(request, orderId);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  return handleCancelOrder(request, orderId);
}

export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  return handleRefundOrder(request, orderId);
}
