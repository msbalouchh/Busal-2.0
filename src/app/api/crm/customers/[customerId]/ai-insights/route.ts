import { handleCustomerAiInsights } from "@/modules/crm/api/customers-route-handlers";

export async function GET(request: Request, context: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await context.params;
  return handleCustomerAiInsights(request, customerId);
}
