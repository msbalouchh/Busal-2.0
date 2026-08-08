import {
  handleCreateBudget,
  handleCreateCostCenter,
  handleCreateFinanceTax,
  handleUpdateFinanceAccount,
} from "@/modules/finance/api/finance-route-handlers";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource");

  switch (resource) {
    case "cost-center":
      return handleCreateCostCenter(request);
    case "budget":
      return handleCreateBudget(request);
    case "tax":
      return handleCreateFinanceTax(request);
    default:
      return handleUpdateFinanceAccount(request);
  }
}
