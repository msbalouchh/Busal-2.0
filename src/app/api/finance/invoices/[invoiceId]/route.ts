import { handleGetFinanceInvoice } from "@/modules/finance/api/finance-route-handlers";

export async function GET(_request: Request, context: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await context.params;
  return handleGetFinanceInvoice(_request, invoiceId);
}
