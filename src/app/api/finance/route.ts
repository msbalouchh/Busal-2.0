import {
  handleBulkFinanceAction,
  handleCreateFinanceAccount,
  handleCreateFinanceInvoice,
  handleCreateJournalEntry,
  handleListFinance,
  handleRecordFinanceExpense,
  handleRecordFinancePayment,
} from "@/modules/finance/api/finance-route-handlers";

export async function GET(request: Request) {
  return handleListFinance(request);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource");

  switch (resource) {
    case "account":
      return handleCreateFinanceAccount(request);
    case "journal":
      return handleCreateJournalEntry(request);
    case "expense":
      return handleRecordFinanceExpense(request);
    case "payment":
      return handleRecordFinancePayment(request);
    default:
      return handleCreateFinanceInvoice(request);
  }
}

export async function PATCH(request: Request) {
  return handleBulkFinanceAction(request);
}
