import {
  handleAcceptKitchenOrder,
  handleAssignKitchenStation,
  handleBumpKitchenOrder,
  handleCompleteKitchenOrder,
  handleFireKitchenOrder,
  handleGetKitchenOrder,
  handleHoldKitchenOrder,
  handleReadyKitchenOrder,
  handleRecallKitchenOrder,
  handleResumeKitchenOrder,
} from "@/modules/kitchen/api/kitchen-route-handlers";

export async function GET(
  _request: Request,
  context: { params: Promise<{ kitchenOrderId: string }> },
) {
  const { kitchenOrderId } = await context.params;
  return handleGetKitchenOrder(_request, kitchenOrderId);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ kitchenOrderId: string }> },
) {
  const { kitchenOrderId } = await context.params;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  switch (action) {
    case "accept":
      return handleAcceptKitchenOrder(request, kitchenOrderId);
    case "fire":
      return handleFireKitchenOrder(request, kitchenOrderId);
    case "hold":
      return handleHoldKitchenOrder(request, kitchenOrderId);
    case "resume":
      return handleResumeKitchenOrder(request, kitchenOrderId);
    case "ready":
      return handleReadyKitchenOrder(request, kitchenOrderId);
    case "bump":
      return handleBumpKitchenOrder(request, kitchenOrderId);
    case "recall":
      return handleRecallKitchenOrder(request, kitchenOrderId);
    case "complete":
      return handleCompleteKitchenOrder(request, kitchenOrderId);
    case "assign-station":
      return handleAssignKitchenStation(request);
    default:
      return handleGetKitchenOrder(request, kitchenOrderId);
  }
}
