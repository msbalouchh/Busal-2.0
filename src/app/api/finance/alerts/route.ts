import { handleFinanceAlerts } from "@/modules/finance/api/finance-route-handlers";

export async function GET(request: Request) {
  return handleFinanceAlerts(request);
}
