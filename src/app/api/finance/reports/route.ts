import { handleFinanceReports } from "@/modules/finance/api/finance-route-handlers";

export async function GET(request: Request) {
  return handleFinanceReports(request);
}
