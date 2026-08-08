import {
  handleApplyPosDiscount,
  handleGetPosTransaction,
  handleProcessPosPayment,
  handleProcessPosRefund,
  handleReprintPosReceipt,
  handleSplitPosBill,
  handleTransferPosTable,
  handleVoidPosOrder,
} from "@/modules/pos/api/pos-route-handlers";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await context.params;
  return handleGetPosTransaction(_request, orderId);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await context.params;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  switch (action) {
    case "discount":
      return handleApplyPosDiscount(request, orderId);
    case "split":
      return handleSplitPosBill(request, orderId);
    case "pay":
      return handleProcessPosPayment(request, orderId);
    case "refund":
      return handleProcessPosRefund(request, orderId);
    case "void":
      return handleVoidPosOrder(request, orderId);
    case "transfer":
      return handleTransferPosTable(request, orderId);
    case "reprint":
      return handleReprintPosReceipt(request, orderId);
    default:
      return handleGetPosTransaction(request, orderId);
  }
}
